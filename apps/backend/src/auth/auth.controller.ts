import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailRequestDto } from './dto/email-request.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { ExchangeCodeDto } from './dto/exchange-code.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { TurnstileGuard } from './guards/turnstile.guard';
import {
    GoogleCallbackGuard,
    GoogleOAuthGuard,
} from './guards/google-oauth.guard';
import { GoogleProfile } from './strategies/google.strategy';
import { SessionMeta } from './interfaces/auth.interfaces';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    public constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly configService: ConfigService,
    ) {}

    @Public()
    @UseGuards(TurnstileGuard)
    @Throttle({ medium: { ttl: 60_000, limit: 5 } })
    @Post('register')
    public async register(@Body() dto: RegisterDto, @Req() req: Request) {
        return this.authService.register(dto, this.meta(req));
    }

    @Public()
    @UseGuards(TurnstileGuard)
    @Throttle({ medium: { ttl: 60_000, limit: 5 } })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    public async login(@Body() dto: LoginDto, @Req() req: Request) {
        return this.authService.login(dto, this.meta(req));
    }

    @Public()
    @Throttle({ short: { ttl: 1_000, limit: 3 }, medium: { ttl: 60_000, limit: 30 } })
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    public async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
        return this.authService.refresh(dto.refreshToken, this.meta(req));
    }

    @Public()
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('logout')
    public async logout(@Body() dto: RefreshDto): Promise<void> {
        await this.authService.logout(dto.refreshToken);
    }

    @Public()
    @UseGuards(GoogleOAuthGuard)
    @Get('google')
    public googleRedirect(): void {
        // Редирект на согласие Google выполняет passport внутри guard'а.
    }

    /**
     * Токены не уходят в query редиректа: фронт получает одноразовый код
     * и меняет его на пару через `POST /auth/google/exchange`.
     */
    @Public()
    @UseGuards(GoogleCallbackGuard)
    @Get('google/callback')
    public async googleCallback(
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<void> {
        const profile = req.user as GoogleProfile;
        const response = await this.authService.loginWithGoogle(
            profile,
            this.meta(req),
        );
        const code = await this.authService.stashForExchange(response);
        const redirect = this.configService.getOrThrow<string>(
            'GOOGLE_SUCCESS_REDIRECT',
        );

        res.redirect(`${redirect}?code=${encodeURIComponent(code)}`);
    }

    // Код приходит только телом: в query он осел бы в логах прокси и в Referer.
    @Public()
    @Throttle({ medium: { ttl: 60_000, limit: 10 } })
    @HttpCode(HttpStatus.OK)
    @Post('google/exchange')
    public async googleExchange(@Body() dto: ExchangeCodeDto) {
        return this.authService.exchangeCode(dto.code);
    }

    @Public()
    @Throttle({ medium: { ttl: 60_000, limit: 10 } })
    @HttpCode(HttpStatus.OK)
    @Post('verify-email')
    public async verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.token);
    }

    @Public()
    @UseGuards(TurnstileGuard)
    @Throttle({ medium: { ttl: 60 * 60_000, limit: 3 } })
    @HttpCode(HttpStatus.ACCEPTED)
    @Post('resend-verification')
    public async resendVerification(@Body() dto: EmailRequestDto): Promise<void> {
        await this.authService.resendVerification(dto.email);
    }

    @Public()
    @UseGuards(TurnstileGuard)
    @Throttle({ medium: { ttl: 60 * 60_000, limit: 3 } })
    @HttpCode(HttpStatus.ACCEPTED)
    @Post('password-reset/request')
    public async requestPasswordReset(@Body() dto: EmailRequestDto): Promise<void> {
        await this.authService.requestPasswordReset(dto.email);
    }

    @Public()
    @Throttle({ medium: { ttl: 60_000, limit: 10 } })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('password-reset/confirm')
    public async confirmPasswordReset(@Body() dto: PasswordResetDto): Promise<void> {
        await this.authService.resetPassword(dto.token, dto.password);
    }

    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('logout-all')
    public async logoutAll(@CurrentUser('id') userId: string): Promise<void> {
        await this.authService.logoutAll(userId);
    }

    @ApiBearerAuth()
    @Get('me')
    public async me(@CurrentUser('id') userId: string) {
        const user = await this.userService.findById(userId);

        return this.authService.publicUser(user);
    }

    private meta(req: Request): SessionMeta {
        return {
            userAgent: req.headers['user-agent'],
            ip: req.ip,
        };
    }
}
