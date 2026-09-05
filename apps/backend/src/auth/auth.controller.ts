import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService, type PublicUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Req() request: Request, @Body() registerDto: RegisterDto): Promise<PublicUser> {
        return this.authService.register(request, registerDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Req() request: Request, @Body() loginDto: LoginDto): Promise<PublicUser> {
        return this.authService.login(request, loginDto);
    }

    @Get('me')
    async me(@Req() request: Request): Promise<PublicUser> {
        return this.authService.me(request);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Post('logout')
    async logout(@Req() request: Request): Promise<void> {
        return this.authService.logout(request);
    }
}
