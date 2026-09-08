import {
    BadRequestException,
    ConflictException,
    Injectable,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'argon2';
import { isMuted } from '../user/mute.util';
import { UserService } from '../user/user.service';
import { TokenService } from './token.service';
import { EmailTokenService } from './email-token.service';
import { MailService } from '../mail/mail.service';
import { MailDeliveryError } from '../mail/mail-delivery.error';
import { AuthMethod, TokenType } from '../generated/prisma/enums';
import { User } from '../generated/prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { SessionMeta, TokenPair } from './interfaces/auth.interfaces';

const DUMMY_PASSWORD_HASH =
    '$argon2id$v=19$m=65536,p=4,t=3$dLi8CevQ86dYIJ7hoMDE+A$mr33BzzBITpUIuryxLjbzfAre0wvV+rdq1ZWjcgTi2I';

export interface AuthResponse extends TokenPair {
    user: {
        id: string;
        email: string;
        displayName: string;
        picture: string | null;
        role: string;
        isVerified: boolean;
        muted: boolean;
        mutedUntil: string | null;
        muteReason: string | null;
        createdAt: string;
    };
}

export interface RegisterResponse extends AuthResponse {
    verificationEmailSent: boolean;
}

export interface EmailChangeResponse extends AuthResponse {
    verificationEmailSent: boolean;
}

@Injectable()
export class AuthService {
    public constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
        private readonly emailTokenService: EmailTokenService,
        private readonly mailService: MailService,
    ) {}

    public async register(dto: RegisterDto, meta: SessionMeta): Promise<RegisterResponse> {
        const existing = await this.userService.findByEmail(dto.email);

        if (existing) {
            throw new ConflictException('Email is already registered.');
        }

        const user = await this.userService.create({
            email: dto.email,
            password: dto.password,
            displayName: dto.name,
            method: AuthMethod.CREDENTIALS,
            isVerified: false,
        });

        const verificationEmailSent = await this.trySendVerification(user.email);
        const response = await this.buildResponse(user, meta);

        return { ...response, verificationEmailSent };
    }

    public async login(dto: LoginDto, meta: SessionMeta): Promise<AuthResponse> {
        const user = await this.userService.findByEmail(dto.email);

        const passwordMatches = await verify(
            user?.password ?? DUMMY_PASSWORD_HASH,
            dto.password,
        );

        if (!user?.password || !passwordMatches) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        return this.buildResponse(user, meta);
    }

    public async refresh(refreshToken: string, meta: SessionMeta): Promise<AuthResponse> {
        const { tokens, user } = await this.tokenService.rotate(
            refreshToken,
            userId => this.userService.findByIdOrNull(userId),
            meta,
        );

        return { ...tokens, user: this.publicUser(user) };
    }

    public async logout(refreshToken: string): Promise<void> {
        await this.tokenService.revoke(refreshToken);
    }

    public async logoutAll(userId: string): Promise<void> {
        await this.tokenService.revokeAllForUser(userId);
    }

    public async verifyEmail(token: string): Promise<AuthResponse['user']> {
        const stored = await this.emailTokenService.consume(
            token,
            TokenType.VERIFICATION,
        );

        if (!stored) {
            throw new BadRequestException('Verification link is invalid or expired.');
        }

        const user = await this.userService.findByEmail(stored.email);

        if (!user) {
            throw new BadRequestException('Verification link is invalid or expired.');
        }

        const verified = user.isVerified
            ? user
            : await this.userService.markVerified(user.id);

        return this.publicUser(verified);
    }

    public async resendVerification(email: string): Promise<void> {
        const user = await this.userService.findByEmail(email);

        if (!user || user.isVerified) {
            return;
        }

        try {
            await this.sendVerification(user.email);
        } catch (error) {
            throw this.deliveryFailure(error);
        }
    }

    public async requestPasswordReset(email: string): Promise<void> {
        const user = await this.userService.findByEmail(email);

        if (!user?.password) {
            return;
        }

        const token = await this.emailTokenService.issue(
            user.email,
            TokenType.PASSWORD_RESET,
        );

        try {
            await this.mailService.sendPasswordReset(user.email, token);
        } catch (error) {
            throw this.deliveryFailure(error);
        }
    }

    public async resetPassword(token: string, password: string): Promise<void> {
        const stored = await this.emailTokenService.consume(
            token,
            TokenType.PASSWORD_RESET,
        );

        if (!stored) {
            throw new BadRequestException('Reset link is invalid or expired.');
        }

        const user = await this.userService.findByEmail(stored.email);

        if (!user) {
            throw new BadRequestException('Reset link is invalid or expired.');
        }

        await this.userService.updatePassword(user.id, password);
        await this.tokenService.revokeAllForUser(user.id);
    }

    public async updateProfile(
        userId: string,
        dto: UpdateProfileDto,
    ): Promise<AuthResponse['user']> {
        const user = await this.userService.findById(userId);
        const displayName = dto.displayName.trim();

        if (displayName.length < 2) {
            throw new BadRequestException(
                'Ник — минимум 2 символа.',
            );
        }

        if (displayName === user.displayName) {
            return this.publicUser(user);
        }

        return this.publicUser(
            await this.userService.updateDisplayName(userId, displayName),
        );
    }

    public async changePassword(
        userId: string,
        dto: ChangePasswordDto,
        meta: SessionMeta,
    ): Promise<AuthResponse> {
        const user = await this.userService.findById(userId);

        await this.assertPassword(user, dto.currentPassword);

        if (dto.password === dto.currentPassword) {
            throw new BadRequestException(
                'Новый пароль должен отличаться от текущего.',
            );
        }

        const updated = await this.userService.updatePassword(
            userId,
            dto.password,
        );

        await this.tokenService.revokeAllForUser(userId);

        return this.buildResponse(updated, meta);
    }

    public async changeEmail(
        userId: string,
        dto: ChangeEmailDto,
        meta: SessionMeta,
    ): Promise<EmailChangeResponse> {
        const user = await this.userService.findById(userId);

        await this.assertPassword(user, dto.currentPassword);

        const email = dto.email.toLowerCase();

        if (email === user.email) {
            throw new BadRequestException('Эта почта уже указана в аккаунте.');
        }

        if (await this.userService.findByEmail(email)) {
            throw new ConflictException('Эта почта уже занята.');
        }

        const updated = await this.userService.updateEmail(userId, email);
        const verificationEmailSent = await this.trySendVerification(
            updated.email,
        );

        await this.tokenService.revokeAllForUser(userId);

        const response = await this.buildResponse(updated, meta);

        return { ...response, verificationEmailSent };
    }

    private async assertPassword(user: User, password: string): Promise<void> {
        const matches = await verify(
            user.password ?? DUMMY_PASSWORD_HASH,
            password,
        );

        if (!user.password || !matches) {
            throw new UnauthorizedException('Текущий пароль неверный.');
        }
    }

    private async sendVerification(email: string): Promise<void> {
        const token = await this.emailTokenService.issue(
            email,
            TokenType.VERIFICATION,
        );

        await this.mailService.sendVerification(email, token);
    }

    private async trySendVerification(email: string): Promise<boolean> {
        try {
            await this.sendVerification(email);

            return true;
        } catch (error) {
            if (error instanceof MailDeliveryError) {
                return false;
            }

            throw error;
        }
    }

    private deliveryFailure(error: unknown): unknown {
        if (error instanceof MailDeliveryError) {
            return new ServiceUnavailableException(
                'Could not send the email right now. Try again in a few minutes.',
            );
        }

        return error;
    }

    public async buildResponse(user: User, meta: SessionMeta): Promise<AuthResponse> {
        const pair = await this.tokenService.issuePair(user, meta);

        return { ...pair, user: this.publicUser(user) };
    }

    public publicUser(user: User): AuthResponse['user'] {
        const muted = isMuted(user);

        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            picture: user.picture,
            role: user.role,
            isVerified: user.isVerified,
            muted,
            mutedUntil: muted ? (user.mutedUntil?.toISOString() ?? null) : null,
            muteReason: muted ? user.muteReason : null,
            createdAt: user.createdAt.toISOString(),
        };
    }
}
