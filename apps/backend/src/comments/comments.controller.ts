import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PublicComment } from './comment.mapper';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { NotMutedGuard } from '../auth/guards/not-muted.guard';
import { VerifiedGuard } from '../auth/guards/verified.guard';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import { UserRole } from '../generated/prisma/enums';

@ApiTags('comments')
@Controller('builds/:buildId/comments')
export class BuildCommentsController {
    public constructor(private readonly commentsService: CommentsService) {}

    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    @Get()
    public findAll(
        @Param('buildId') buildId: string,
        @CurrentUser() viewer: AuthenticatedUser | undefined,
    ): Promise<PublicComment[]> {
        return this.commentsService.findForBuild(
            buildId,
            viewer?.role === UserRole.ADMIN,
        );
    }

    @ApiBearerAuth()
    @UseGuards(VerifiedGuard, NotMutedGuard)
    @Throttle({ medium: { ttl: 60_000, limit: 10 } })
    @Post()
    public create(
        @Param('buildId') buildId: string,
        @Body() dto: CreateCommentDto,
        @CurrentUser('id') userId: string,
    ): Promise<PublicComment> {
        return this.commentsService.create(buildId, userId, dto);
    }
}

@ApiTags('comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
    public constructor(private readonly commentsService: CommentsService) {}

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Delete(':id')
    public hide(
        @Param('id') id: string,
        @CurrentUser('id') adminId: string,
    ): Promise<PublicComment> {
        return this.commentsService.hide(id, adminId);
    }

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Post(':id/restore')
    public restore(@Param('id') id: string): Promise<PublicComment> {
        return this.commentsService.restore(id);
    }
}
