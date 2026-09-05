import { Injectable, NotFoundException } from '@nestjs/common';
import { ITEMS, type Item } from './items.data';

@Injectable()
export class ItemsService {
    findAll(): Item[] {
        return ITEMS;
    }

    findOne(id: string): Item {
        const item = ITEMS.find((candidate) => candidate.id === id);

        if (!item) {
            throw new NotFoundException(`Item "${id}" not found`);
        }

        return item;
    }

    exists(id: string): boolean {
        return ITEMS.some((candidate) => candidate.id === id);
    }
}
