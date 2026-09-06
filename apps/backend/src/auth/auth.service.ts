import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'argon2';
import { isMuted } from '../user/mute.util';
import { UserService } from '../user/user.service';
import { TokenService } from './token.service';
import { EmailTokenService } from './email-token.service';
import { MailService } from '../mail/mail.service';
import { AuthMethod, TokenType } from '../generated/prisma/enums';
import { User } from '../generated/prisma/client';
import { GoogleProfile } from './strategies/google.strategy';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
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

@Injectable()
export class AuthService {
    public constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
        private readonly emailTokenService: EmailTokenService,
        private readonly mailService: MailService,
    ) {}

    public async register(dto: RegisterDto, meta: SessionMeta): Promise<AuthResponse> {
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

        await this.sendVerification(user.email);

        return this.buildResponse(user, meta);
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

    public async loginWithGoogle(
        profile: GoogleProfile,
        meta: SessionMeta,
    ): Promise<AuthResponse> {
        const linked = await this.userService.findByProviderAccount(
            'google',
            profile.providerAccountId,
        );

        if (linked) {
            return this.buildResponse(linked, meta);
        }

        if (!profile.emailVerified) {
            throw new UnauthorizedException('Google account email is not verified.');
        }

        const existing = await this.userService.findByEmail(profile.email);

        const user =
            existing ??
            (await this.userService.create({
                email: profile.email,
                password: null,
                displayName: profile.displayName,
                picture: profile.picture,
                method: AuthMethod.GOOGLE,
                isVerified: true,
            }));

        await this.userService.linkAccount({
            userId: user.id,
            provider: 'google',
            providerAccountId: profile.providerAccountId,
        });

        const verified = user.isVerified
            ? user
            : await this.userService.markVerified(user.id);

        return this.buildResponse(verified, meta);
    }

    public async stashForExchange(response: AuthResponse): Promise<string> {
        return this.tokenService.stashForExchange(
            {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresIn: response.expiresIn,
            },
            response.user.id,
        );
    }

    public async exchangeCode(code: string): Promise<AuthResponse> {
        const { userId, ...pair } = await this.tokenService.claimExchange(code);
        const user = await this.userService.findById(userId);

        return { ...pair, user: this.publicUser(user) };
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

        if (user && !user.isVerified) {
            await this.sendVerification(user.email);
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

        await this.mailService.sendPasswordReset(user.email, token);
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

    private async sendVerification(email: string): Promise<void> {
        const token = await this.emailTokenService.issue(
            email,
            TokenType.VERIFICATION,
        );

        await this.mailService.sendVerification(email, token);
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
