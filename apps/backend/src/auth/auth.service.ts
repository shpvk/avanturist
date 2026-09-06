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

/**
 * Хеш случайной строки, ни от чего не подходящий. Нужен, чтобы на неизвестный
 * адрес и на аккаунт без пароля логин тратил столько же времени, сколько на
 * реальную проверку: иначе по времени ответа можно перебрать существующие
 * аккаунты, несмотря на одинаковый текст ошибки.
 */
const DUMMY_PASSWORD_HASH =
    '$argon2id$v=19$m=65536,p=4,t=3$dLi8CevQ86dYIJ7hoMDE+A$mr33BzzBITpUIuryxLjbzfAre0wvV+rdq1ZWjcgTi2I';

/** Ответ логина, регистрации и ротации. */
export interface AuthResponse extends TokenPair {
    user: {
        id: string;
        email: string;
        displayName: string;
        picture: string | null;
        role: string;
        isVerified: boolean;
        /** Мут закрывает комментарии; интерфейс знает об этом до отправки. */
        muted: boolean;
        /** `null` при бессрочном муте и при снятом. */
        mutedUntil: string | null;
        muteReason: string | null;
        /** Дата регистрации в ISO — её показывает страница профиля. */
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

        // Один и тот же текст и то же время ответа на «нет пользователя» и
        // «неверный пароль», чтобы форма логина не работала как проверка
        // существования аккаунта.
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

    /**
     * Вход через Google. Аккаунт связывается с существующим пользователем только
     * если Google подтвердил владение адресом — иначе чужой почтой можно было бы
     * захватить аккаунт с паролем.
     */
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

        // Токены Google приложению не нужны — оно ходит в их API только один
        // раз, при входе. Незачем держать в базе то, что утечёт вместе с ней.
        await this.userService.linkAccount({
            userId: user.id,
            provider: 'google',
            providerAccountId: profile.providerAccountId,
        });

        // Google подтвердил адрес — старую неподтверждённую регистрацию можно открыть.
        const verified = user.isVerified
            ? user
            : await this.userService.markVerified(user.id);

        return this.buildResponse(verified, meta);
    }

    /** Прячет пару токенов за одноразовым кодом для OAuth-редиректа. */
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

    /** Подтверждение почты: открывает публикацию билдов и комментариев. */
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

    /**
     * Повторная отправка письма и запрос сброса отвечают одинаково независимо от
     * того, есть ли такой адрес: иначе форма превращается в перебор пользователей.
     */
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

    /** Смена пароля разлогинивает все устройства: старые сессии могли быть чужими. */
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

    /** Выдаёт пару токенов и публичный профиль. */
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
