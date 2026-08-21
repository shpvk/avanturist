import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { type BuildView } from './build.view';
import { BuildsService } from './builds.service';
import { CreateBuildDto } from './dto/create-build.dto';

@Controller('builds')
export class BuildsController {
    constructor(private readonly buildsService: BuildsService) {}

    @Get()
    findAll(): Promise<BuildView[]> {
        return this.buildsService.findAll();
    }

    @Get('random')
    findRandom(): Promise<BuildView> {
        return this.buildsService.findRandom();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BuildView> {
        return this.buildsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateBuildDto): Promise<BuildView> {
        return this.buildsService.create(dto);
    }
}
