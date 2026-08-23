import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { HeroesModule } from './heroes/heroes.module';
import {ConfigModule} from "@nestjs/config";
import {IS_DEV_ENV} from "./libs/common/utils/is-dev.utils";
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            ignoreEnvFile: !IS_DEV_ENV,
            isGlobal: true,
            expandVariables: true,
        }),
        HeroesModule,
        AuthModule,
        PrismaModule,
        UserModule,
    ],
})
export class AppModule {}
