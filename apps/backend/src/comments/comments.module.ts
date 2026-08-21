import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildsModule } from '../builds/builds.module';
import { CommentEntity } from './comment.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
    imports: [TypeOrmModule.forFeature([CommentEntity]), BuildsModule],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}
