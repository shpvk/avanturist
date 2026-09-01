import {
    ExecutionContext,
    Injectable,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

/**
 * Вход через Google включается только при заполненных ключах:
 * без них маршрут честно отвечает 503, а не падает пятисоткой из passport.
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
    public constructor(private readonly configService: ConfigService) {
        super();
    }

    public canActivate(context: ExecutionContext) {
        if (!this.configService.get<string>('GOOGLE_CLIENT_ID')) {
            throw new ServiceUnavailableException('Google sign-in is not configured.');
        }

        return super.canActivate(context);
    }
}
