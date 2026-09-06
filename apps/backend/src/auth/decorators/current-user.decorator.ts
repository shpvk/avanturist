import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/auth.interfaces';

export const CurrentUser = createParamDecorator(
    (key: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();

        return key ? request.user?.[key] : request.user;
    },
);
