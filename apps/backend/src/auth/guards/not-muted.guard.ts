import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { AuthenticatedUser } from '../interfaces/auth.interfaces';

/**
 * Мут закрывает комментарии и только их. Проверка идёт в базу, а не в токен:
 * access живёт минутами, и выданный до мута токен иначе продолжал бы писать.
 */
@Injectable()
export class NotMutedGuard implements CanActivate {
    public constructor(private readonly userService: UserService) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<{ user?: AuthenticatedUser }>();

        if (!request.user) {
            return false;
        }

        const mute = await this.userService.activeMute(request.user.id);

        if (!mute) {
            return true;
        }

        // Срок и причина уходят в теле: интерфейс показывает их автору, а не
        // безымянное «нельзя».
        throw new ForbiddenException({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Comments are closed for your account.',
            mutedUntil: mute.until?.toISOString() ?? null,
            muteReason: mute.reason,
        });
    }
}
