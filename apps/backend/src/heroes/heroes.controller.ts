import { Controller, Get, Header, Param } from '@nestjs/common';
import { type Hero } from './heroes.data';
import { HeroesService } from './heroes.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('heroes')
export class HeroesController {
    constructor(private readonly heroesService: HeroesService) {}

    @Header('Cache-Control', 'public, max-age=3600')
    @Get()
    findAll(): Hero[] {
        return this.heroesService.findAll();
    }

    @Header('Cache-Control', 'no-store')
    @Get('random')
    findRandom(): Hero {
        return this.heroesService.findRandom();
    }

    @Header('Cache-Control', 'public, max-age=3600')
    @Get(':id')
    findOne(@Param('id') id: string): Hero {
        return this.heroesService.findOne(id);
    }
}
