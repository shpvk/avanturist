import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildsModule } from './builds/builds.module';
import { CommentsModule } from './comments/comments.module';
import { HeroesModule } from './heroes/heroes.module';
import { VotesModule } from './votes/votes.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST ?? 'localhost',
            port: Number(process.env.POSTGRES_PORT ?? 5430),
            username: process.env.POSTGRES_USER ?? 'buildverdict',
            password: process.env.POSTGRES_PASSWORD ?? 'buildverdict',
            database: process.env.POSTGRES_DB ?? 'buildverdict',
            autoLoadEntities: true,
            // MVP only: schema is derived from entities instead of migrations.
            synchronize: true,
        }),
        HeroesModule,
        BuildsModule,
        VotesModule,
        CommentsModule,
    ],
})
export class AppModule {}
