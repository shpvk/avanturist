import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuildsService } from '../builds/builds.service';
import { CommentEntity } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(CommentEntity)
        private readonly comments: Repository<CommentEntity>,
        private readonly buildsService: BuildsService,
    ) {}

    async findByBuild(buildId: string): Promise<CommentEntity[]> {
        await this.buildsService.findOne(buildId);

        return this.comments.find({ where: { buildId }, order: { createdAt: 'ASC' } });
    }

    async create(buildId: string, dto: CreateCommentDto): Promise<CommentEntity> {
        await this.buildsService.findOne(buildId);

        return this.comments.save(
            this.comments.create({ buildId, author: dto.author, text: dto.text }),
        );
    }
}
