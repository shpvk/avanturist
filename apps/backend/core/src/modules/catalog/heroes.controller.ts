import { Controller, Get } from '@nestjs/common';
import { Hero } from './entities/hero.entity';
import { HeroesService } from './heroes.service';

@Controller('heroes')
export class HeroesController {
  constructor(private readonly heroesService: HeroesService) {}

  @Get()
  async getAll(): Promise<Hero[]> {
    return this.heroesService.getAll();
  }
}
