import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailRequestDto } from './dto/email-request.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { TurnstileGuard } from './guards/turnstile.guard';
import { SessionMeta } from './interfaces/auth.interfaces';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    public constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
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

    @ApiBearerAuth()
    @Throttle({ medium: { ttl: 60_000, limit: 10 } })
    @Patch('me')
    public async updateProfile(
        @CurrentUser('id') userId: string,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.authService.updateProfile(userId, dto);
    }

    @ApiBearerAuth()
    @Throttle({ medium: { ttl: 60_000, limit: 5 } })
    @HttpCode(HttpStatus.OK)
    @Post('me/password')
    public async changePassword(
        @CurrentUser('id') userId: string,
        @Body() dto: ChangePasswordDto,
        @Req() req: Request,
    ) {
        return this.authService.changePassword(userId, dto, this.meta(req));
    }

    @ApiBearerAuth()
    @Throttle({ medium: { ttl: 60 * 60_000, limit: 5 } })
    @HttpCode(HttpStatus.OK)
    @Post('me/email')
    public async changeEmail(
        @CurrentUser('id') userId: string,
        @Body() dto: ChangeEmailDto,
        @Req() req: Request,
    ) {
        return this.authService.changeEmail(userId, dto, this.meta(req));
    }

    private meta(req: Request): SessionMeta {
        return {
            userAgent: req.headers['user-agent'],
            ip: req.ip,
        };
    }
}
