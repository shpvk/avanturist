import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
    commentSelect,
    PublicComment,
    toPublicComment,
} from './comment.mapper';

@Injectable()
export class CommentsService {
    public constructor(private readonly prismaService: PrismaService) {}

    public async findForBuild(
        buildId: string,
        moderator: boolean,
    ): Promise<PublicComment[]> {
        await this.assertBuildExists(buildId);

        const comments = await this.prismaService.comment.findMany({
            where: moderator ? { buildId } : { buildId, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: commentSelect,
        });

        return comments.map(comment => toPublicComment(comment, { moderator }));
    }

    public async create(
        buildId: string,
        userId: string,
        dto: CreateCommentDto,
    ): Promise<PublicComment> {
        await this.assertBuildExists(buildId);

        const comment = await this.prismaService.comment.create({
            data: { buildId, userId, text: dto.text.trim() },
            select: commentSelect,
        });

        return toPublicComment(comment, { moderator: false });
    }

    public async hide(id: string, adminId: string): Promise<PublicComment> {
        await this.assertCommentExists(id);

        const comment = await this.prismaService.comment.update({
            where: { id },
            data: { deletedAt: new Date(), deletedById: adminId },
            select: commentSelect,
        });

        return toPublicComment(comment, { moderator: true });
    }

    public async restore(id: string): Promise<PublicComment> {
        await this.assertCommentExists(id);

        const comment = await this.prismaService.comment.update({
            where: { id },
            data: { deletedAt: null, deletedById: null },
            select: commentSelect,
        });

        return toPublicComment(comment, { moderator: true });
    }

    private async assertBuildExists(buildId: string): Promise<void> {
        const build = await this.prismaService.build.findUnique({
            where: { id: buildId },
            select: { id: true },
        });

        if (!build) {
            throw new NotFoundException('Build not found');
        }
    }

    private async assertCommentExists(id: string): Promise<void> {
        const comment = await this.prismaService.comment.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
    }
}
