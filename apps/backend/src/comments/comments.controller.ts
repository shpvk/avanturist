import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CommentEntity } from './comment.entity';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('builds/:buildId/comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Get()
    findByBuild(@Param('buildId', ParseUUIDPipe) buildId: string): Promise<CommentEntity[]> {
        return this.commentsService.findByBuild(buildId);
    }

    @Post()
    create(
        @Param('buildId', ParseUUIDPipe) buildId: string,
        @Body() dto: CreateCommentDto,
    ): Promise<CommentEntity> {
        return this.commentsService.create(buildId, dto);
    }
}
