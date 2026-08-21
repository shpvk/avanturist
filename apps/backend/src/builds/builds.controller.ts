import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { BuildEntity } from './build.entity';
import { BuildsService } from './builds.service';
import { CreateBuildDto } from './dto/create-build.dto';

@Controller('builds')
export class BuildsController {
    constructor(private readonly buildsService: BuildsService) {}

    @Get()
    findAll(): Promise<BuildEntity[]> {
        return this.buildsService.findAll();
    }

    @Get('random')
    findRandom(): Promise<BuildEntity> {
        return this.buildsService.findRandom();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BuildEntity> {
        return this.buildsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateBuildDto): Promise<BuildEntity> {
        return this.buildsService.create(dto);
    }
}
