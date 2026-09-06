import { Controller, Get, Header, Param } from '@nestjs/common';
import { type Item } from './items.data';
import { ItemsService } from './items.service';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('items')
export class ItemsController {
    constructor(private readonly itemsService: ItemsService) {}

    @Header('Cache-Control', 'public, max-age=3600')
    @Get()
    findAll(): Item[] {
        return this.itemsService.findAll();
    }

    @Header('Cache-Control', 'public, max-age=3600')
    @Get(':id')
    findOne(@Param('id') id: string): Item {
        return this.itemsService.findOne(id);
    }
}
