import {
    ExecutionContext,
    Injectable,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { TokenService } from '../token.service';

/**
 * Вход через Google включается только при заполненных ключах:
 * без них маршрут честно отвечает 503, а не падает пятисоткой из passport.
 *
 * Заодно здесь выдаётся одноразовый `state`. Cookie и сессий в проекте нет,
 * поэтому passport хранить его негде — метка живёт в Redis, а проверяет её
 * `GoogleCallbackGuard`.
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
    public constructor(
        protected readonly configService: ConfigService,
        protected readonly tokenService: TokenService,
    ) {
        super();
    }

    public canActivate(context: ExecutionContext) {
        this.assertConfigured();

        return super.canActivate(context);
    }

    public async getAuthenticateOptions(
        _context: ExecutionContext,
    ): Promise<Record<string, unknown>> {
        return { state: await this.tokenService.issueOAuthState() };
    }

    protected assertConfigured(): void {
        if (!this.configService.get<string>('GOOGLE_CLIENT_ID')) {
            throw new ServiceUnavailableException('Google sign-in is not configured.');
        }
    }
}

/**
 * Возврат от Google. Без проверки `state` атакующий может начать вход сам,
 * а ссылку с готовым `code` подсунуть жертве — её браузер завершит вход
 * в чужой аккаунт (login CSRF).
 */
@Injectable()
export class GoogleCallbackGuard extends GoogleOAuthGuard {
    public async canActivate(context: ExecutionContext): Promise<boolean> {
        this.assertConfigured();

        const request = context.switchToHttp().getRequest<Request>();
        const state = request.query?.state;

        const valid = await this.tokenService.claimOAuthState(
            typeof state === 'string' ? state : undefined,
        );

        if (!valid) {
            throw new UnauthorizedException(
                'Google sign-in state is invalid or expired.',
            );
        }

        // Для passport-стратегии это всегда Promise<boolean>.
        return (await super.canActivate(context)) as boolean;
    }

    /** На возврате `state` не выдаём: он уже пришёл в запросе и проверен выше. */
    public async getAuthenticateOptions(): Promise<Record<string, unknown>> {
        return {};
    }
}
