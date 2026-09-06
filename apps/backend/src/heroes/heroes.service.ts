import { Injectable, NotFoundException } from '@nestjs/common';
import { HEROES, type Hero } from './heroes.data';

const byId = new Map(HEROES.map(hero => [hero.id, hero]));

@Injectable()
export class HeroesService {
    findAll(): Hero[] {
        return HEROES;
    }

    findOne(id: string): Hero {
        const hero = byId.get(id);

        if (!hero) {
            throw new NotFoundException(`Hero "${id}" not found`);
        }

        return hero;
    }

    exists(id: string): boolean {
        return byId.has(id);
    }

    searchIds(term: string): string[] {
        const needle = term.trim().toLowerCase();

        if (!needle) {
            return [];
        }

        return HEROES.filter(hero => hero.name.toLowerCase().includes(needle)).map(
            hero => hero.id,
        );
    }

    findRandom(): Hero {
        return HEROES[Math.floor(Math.random() * HEROES.length)];
    }
}
