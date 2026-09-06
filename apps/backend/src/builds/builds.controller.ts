import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BuildsService, FeedPage, PublicBuild } from './builds.service';
import { CreateBuildDto } from './dto/create-build.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VerifiedGuard } from '../auth/guards/verified.guard';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';

@ApiTags('builds')
@Controller('builds')
export class BuildsController {
    public constructor(private readonly buildsService: BuildsService) {}

    @Public()
    @Get()
    public findAll(@Query() query: FeedQueryDto): Promise<FeedPage> {
        return this.buildsService.findFeed(query);
    }

    @Public()
    @Get('random')
    public async findRandom(): Promise<PublicBuild> {
        const build = await this.buildsService.findRandom();

        if (!build) {
            throw new NotFoundException('No builds published yet');
        }

        return build;
    }

    @Public()
    @Get(':id')
    public findOne(@Param('id') id: string): Promise<PublicBuild> {
        return this.buildsService.findOne(id);
    }

    @ApiBearerAuth()
    @UseGuards(VerifiedGuard)
    @Post()
    public create(
        @Body() dto: CreateBuildDto,
        @CurrentUser('id') userId: string,
    ): Promise<PublicBuild> {
        return this.buildsService.create(dto, userId);
    }

    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    public remove(
        @Param('id') id: string,
        @CurrentUser() viewer: AuthenticatedUser,
    ): Promise<void> {
        return this.buildsService.remove(id, viewer);
    }
}
