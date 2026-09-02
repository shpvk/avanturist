import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuildDto } from './dto/create-build.dto';
import {
    commentSelect,
    CommentRow,
    PublicComment,
    toPublicComment,
} from '../comments/comment.mapper';

/** Публичный вид сборки: предметы уже развёрнуты, автор — именем, а не связью. */
export interface PublicBuild {
    id: string;
    title: string;
    heroId: string;
    items: string[];
    author: string;
    authorId: string;
    createdAt: string;
    comments: PublicComment[];
}

/**
 * Лента отдаёт только живые комментарии: скрытые модератором админ дочитывает
 * отдельным запросом к ветке, а не получает вместе со всей лентой.
 */
const buildInclude = {
    author: { select: { id: true, displayName: true } },
    comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: commentSelect,
    },
} as const;

@Injectable()
export class BuildsService {
    public constructor(private readonly prismaService: PrismaService) {}

    /** Лента: от новых к старым. */
    public async findAll(): Promise<PublicBuild[]> {
        const builds = await this.prismaService.build.findMany({
            orderBy: { createdAt: 'desc' },
            include: buildInclude,
        });

        return builds.map(build => this.toPublic(build));
    }

    public async create(dto: CreateBuildDto, userId: string): Promise<PublicBuild> {
        const build = await this.prismaService.build.create({
            data: {
                title: dto.title,
                heroId: dto.heroId,
                items: JSON.stringify(dto.items),
                userId,
            },
            include: buildInclude,
        });

        return this.toPublic(build);
    }

    private toPublic(build: {
        id: string;
        title: string;
        heroId: string;
        items: string;
        createdAt: Date;
        author: { id: string; displayName: string };
        comments: CommentRow[];
    }): PublicBuild {
        return {
            id: build.id,
            title: build.title,
            heroId: build.heroId,
            items: this.parseItems(build.items),
            author: build.author.displayName,
            authorId: build.author.id,
            createdAt: build.createdAt.toISOString(),
            comments: build.comments.map(comment =>
                toPublicComment(comment, { moderator: false }),
            ),
        };
    }

    /** Предметы лежат в одной колонке JSON-строкой: битую строку лента переживает. */
    private parseItems(raw: string): string[] {
        try {
            const parsed: unknown = JSON.parse(raw);

            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            return [];
        }
    }
}
