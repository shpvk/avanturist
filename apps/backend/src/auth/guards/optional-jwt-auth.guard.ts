import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../interfaces/auth.interfaces';

/**
 * Мягкая версия JwtAuthGuard: подставляет пользователя, если токен пришёл, и
 * молча пропускает запрос, если нет. Нужна публичным маршрутам, ответ которых
 * зависит от роли — например ветке комментариев, где админ видит скрытые.
 *
 * Маршрут при этом остаётся помеченным `@Public()`, иначе глобальный
 * JwtAuthGuard закроет его раньше.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    public handleRequest<TUser = AuthenticatedUser | undefined>(
        _error: unknown,
        user: TUser | false,
    ): TUser {
        return (user || undefined) as TUser;
    }
}
