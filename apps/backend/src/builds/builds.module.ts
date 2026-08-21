import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeroesModule } from '../heroes/heroes.module';
import { BuildEntity } from './build.entity';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';

@Module({
    imports: [TypeOrmModule.forFeature([BuildEntity]), HeroesModule],
    controllers: [BuildsController],
    providers: [BuildsService],
    exports: [BuildsService],
})
export class BuildsModule {}
