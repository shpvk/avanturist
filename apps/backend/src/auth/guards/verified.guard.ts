import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/auth.interfaces';

@Injectable()
export class VerifiedGuard implements CanActivate {
    public canActivate(context: ExecutionContext): boolean {
        const request = context
            .switchToHttp()
            .getRequest<{ user?: AuthenticatedUser }>();

        if (!request.user?.isVerified) {
            throw new ForbiddenException(
                'Confirm your email to publish builds and comments.',
            );
        }

        return true;
    }
}
