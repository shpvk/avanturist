import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { HeroesModule } from './heroes/heroes.module';
import { IS_DEV_ENV } from './libs/common/utils/is-dev.utils';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { BuildsModule } from './builds/builds.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
    imports: [
        ConfigModule.forRoot({
            ignoreEnvFile: !IS_DEV_ENV,
            isGlobal: true,
            expandVariables: true,
        }),
        ThrottlerModule.forRoot({
            throttlers: [
                { name: 'short', ttl: 1_000, limit: 10 },
                { name: 'medium', ttl: 60_000, limit: 60 },
            ],
        }),
        RedisModule,
        HeroesModule,
        AuthModule,
        BuildsModule,
        PrismaModule,
        UserModule,
    ],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        // Закрыто по умолчанию: публичные маршруты помечаются декоратором @Public().
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
    ],
})
export class AppModule {}
