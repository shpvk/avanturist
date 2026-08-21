import { Controller, Get, Param } from '@nestjs/common';
import { type Hero } from './heroes.data';
import { HeroesService } from './heroes.service';

@Controller('heroes')
export class HeroesController {
    constructor(private readonly heroesService: HeroesService) {}

    @Get()
    findAll(): Hero[] {
        return this.heroesService.findAll();
    }

    @Get('random')
    findRandom(): Hero {
        return this.heroesService.findRandom();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Hero {
        return this.heroesService.findOne(id);
    }
}
