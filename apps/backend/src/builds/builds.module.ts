import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HeroesModule } from '../heroes/heroes.module';
import { ItemsModule } from '../items/items.module';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';

@Module({
    imports: [PrismaModule, HeroesModule, ItemsModule],
    controllers: [BuildsController],
    providers: [BuildsService],
    exports: [BuildsService],
})
export class BuildsModule {}
