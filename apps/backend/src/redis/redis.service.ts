import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis, { Redis } from 'ioredis';

/**
 * Единственное подключение к Redis на всё приложение.
 * Здесь живут refresh-токены: сессии, маркеры использованных токенов и индексы семей.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
    public readonly client: Redis;

    public constructor(private readonly configService: ConfigService) {
        this.client = new IORedis(
            this.configService.getOrThrow<string>('REDIS_URI'),
            { lazyConnect: false, maxRetriesPerRequest: 3 },
        );
    }

    public async onModuleDestroy(): Promise<void> {
        await this.client.quit();
    }
}
