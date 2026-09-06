import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../interfaces/auth.interfaces';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    public handleRequest<TUser = AuthenticatedUser | undefined>(
        _error: unknown,
        user: TUser | false,
    ): TUser {
        return (user || undefined) as TUser;
    }
}
