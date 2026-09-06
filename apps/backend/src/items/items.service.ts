import { Injectable, NotFoundException } from '@nestjs/common';
import { ITEMS, type Item } from './items.data';

const byId = new Map(ITEMS.map(item => [item.id, item]));

@Injectable()
export class ItemsService {
    findAll(): Item[] {
        return ITEMS;
    }

    findOne(id: string): Item {
        const item = byId.get(id);

        if (!item) {
            throw new NotFoundException(`Item "${id}" not found`);
        }

        return item;
    }

    exists(id: string): boolean {
        return byId.has(id);
    }
}
