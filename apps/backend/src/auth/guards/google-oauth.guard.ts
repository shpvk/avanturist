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

        return (await super.canActivate(context)) as boolean;
    }

    public async getAuthenticateOptions(): Promise<Record<string, unknown>> {
        return {};
    }
}
