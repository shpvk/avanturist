import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { parseBoolean } from '../../libs/common/utils/parse-boolean.utils';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
    success: boolean;
    'error-codes'?: string[];
}

/**
 * Проверяет токен Cloudflare Turnstile из поля `turnstileToken` в теле запроса.
 * При выключенном TURNSTILE_ENABLED пропускает всё: так работает локальная разработка.
 */
@Injectable()
export class TurnstileGuard implements CanActivate {
    private readonly logger = new Logger(TurnstileGuard.name);

    public constructor(private readonly configService: ConfigService) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const enabled = parseBoolean(
            this.configService.get<string>('TURNSTILE_ENABLED') ?? 'false',
        );

        if (!enabled) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const token = (request.body as { turnstileToken?: string })?.turnstileToken;

        if (!token) {
            throw new BadRequestException('Captcha token is required.');
        }

        const body = new URLSearchParams({
            secret: this.configService.getOrThrow<string>('TURNSTILE_SECRET_KEY'),
            response: token,
        });

        if (request.ip) {
            body.set('remoteip', request.ip);
        }

        let result: TurnstileVerifyResponse;

        try {
            const response = await fetch(VERIFY_URL, { method: 'POST', body });

            result = (await response.json()) as TurnstileVerifyResponse;
        } catch (error) {
            this.logger.error('Turnstile verification request failed.', error);

            throw new ServiceUnavailableException('Captcha verification failed.');
        }

        if (!result.success) {
            this.logger.warn(
                `Turnstile rejected a request: ${result['error-codes']?.join(', ') ?? 'unknown'}`,
            );

            throw new BadRequestException('Captcha verification failed.');
        }

        return true;
    }
}
