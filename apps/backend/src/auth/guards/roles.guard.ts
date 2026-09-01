import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../generated/prisma/enums';
import { AuthenticatedUser } from '../interfaces/auth.interfaces';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    public constructor(private readonly reflector: Reflector) {}

    public canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!roles?.length) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<{ user?: AuthenticatedUser }>();

        return !!request.user && roles.includes(request.user.role);
    }
}
