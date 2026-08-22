import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HeroesModule } from './heroes/heroes.module';
import {ConfigModule} from "@nestjs/config";
import {IS_DEV_ENV} from "./libs/common/utils/is-dev.utils";

@Module({
    imports: [
        ConfigModule.forRoot({
            ignoreEnvFile: !IS_DEV_ENV,
            isGlobal: true,
        }),
        HeroesModule,
        AuthModule,
    ],
})
export class AppModule {}
