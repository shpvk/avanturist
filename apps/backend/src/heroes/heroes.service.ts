import { Injectable, NotFoundException } from '@nestjs/common';
import { HEROES, type Hero } from './heroes.data';

@Injectable()
export class HeroesService {
    findAll(): Hero[] {
        return HEROES;
    }

    findOne(id: string): Hero {
        const hero = HEROES.find((candidate) => candidate.id === id);

        if (!hero) {
            throw new NotFoundException(`Hero "${id}" not found`);
        }

        return hero;
    }

    exists(id: string): boolean {
        return HEROES.some((candidate) => candidate.id === id);
    }

    findRandom(): Hero {
        return HEROES[Math.floor(Math.random() * HEROES.length)];
    }
}
