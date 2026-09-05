import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from './token.service';
import { EmailTokenService } from './email-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserModule } from '../user/user.module';
import { StringValue } from '../libs/common/utils/ms.util';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        UserModule,
        RedisModule,
        PrismaModule,
        MailModule,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
                signOptions: {
                    expiresIn:
                        configService.getOrThrow<StringValue>('JWT_ACCESS_TTL'),
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        TokenService,
        EmailTokenService,
        JwtStrategy,
        {
            // Стратегия поднимается только с настроенными ключами: без них
            // приложение должно стартовать, а маршрут — отвечать 503.
            provide: GoogleStrategy,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) =>
                configService.get<string>('GOOGLE_CLIENT_ID')
                    ? new GoogleStrategy(configService)
                    : null,
        },
    ],
    exports: [AuthService, TokenService],
})
export class AuthModule {}
