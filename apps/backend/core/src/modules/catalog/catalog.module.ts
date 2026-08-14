import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hero } from './entities/hero.entity';
import { HeroesController } from './heroes.controller';
import { HeroesService } from './heroes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Hero])],
  controllers: [HeroesController],
  providers: [HeroesService],
  exports: [HeroesService],
})
export class CatalogModule {}
