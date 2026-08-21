import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BuildsModule } from './builds/builds.module';
import { CommentsModule } from './comments/comments.module';
import { databaseConfig } from './database/data-source';
import { HeroesModule } from './heroes/heroes.module';
import { VotesModule } from './votes/votes.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            ...databaseConfig,
            autoLoadEntities: true,
            // MVP only: schema is derived from entities instead of migrations.
            synchronize: true,
        }),
        HeroesModule,
        BuildsModule,
        VotesModule,
        CommentsModule,
        AuthModule,
    ],
})
export class AppModule {}
