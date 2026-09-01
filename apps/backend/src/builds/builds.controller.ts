import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BuildsService } from './builds.service';
import { CreateBuildDto } from './dto/create-build.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VerifiedGuard } from '../auth/guards/verified.guard';

@ApiTags('builds')
@Controller('builds')
export class BuildsController {
    public constructor(private readonly buildsService: BuildsService) {}

    @Public()
    @Get()
    public findAll() {
        return this.buildsService.findAll();
    }

    // Публиковать билды может только вошедший пользователь с подтверждённой почтой.
    @ApiBearerAuth()
    @UseGuards(VerifiedGuard)
    @Post()
    public create(
        @Body() dto: CreateBuildDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.buildsService.create(dto, userId);
    }
}
