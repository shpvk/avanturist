import { DataSource } from 'typeorm';
import { BuildEntity } from '../builds/build.entity';
import { CommentEntity } from '../comments/comment.entity';
import { VoteEntity } from '../votes/vote.entity';

export const databaseConfig = {
    type: 'postgres' as const,
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5430),
    username: process.env.POSTGRES_USER ?? 'buildverdict',
    password: process.env.POSTGRES_PASSWORD ?? 'buildverdict',
    database: process.env.POSTGRES_DB ?? 'buildverdict',
};

export const entities = [BuildEntity, VoteEntity, CommentEntity];

/** Подключение для скриптов вне Nest-приложения (например, наполнения базы). */
export const createDataSource = (): DataSource =>
    new DataSource({ ...databaseConfig, entities, synchronize: true });
