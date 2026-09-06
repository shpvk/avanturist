import {Injectable, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client'
import {ConfigService} from "@nestjs/config";
import {PrismaPg} from "@prisma/adapter-pg";

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    constructor(config: ConfigService) {
        const adapter = new PrismaPg({
            connectionString: config.getOrThrow<string>('POSTGRES_URI'),
        });

        super({ adapter });
    }

    public async onModuleInit(): Promise<void> {
        await this.$connect()
    }

    public async onModuleDestroy(): Promise<void> {
        await this.$disconnect()
    }
}
