import { Controller, Get, Param } from '@nestjs/common';
import { type Item } from './items.data';
import { ItemsService } from './items.service';
import { Public } from '../auth/decorators/public.decorator';

// Каталог предметов нужен форме сборки ещё до входа, как и каталог героев.
@Public()
@Controller('items')
export class ItemsController {
    constructor(private readonly itemsService: ItemsService) {}

    @Get()
    findAll(): Item[] {
        return this.itemsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Item {
        return this.itemsService.findOne(id);
    }
}
