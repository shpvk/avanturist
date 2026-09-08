import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HeroesService } from '../heroes/heroes.service';
import { ItemsService } from '../items/items.service';
import { CreateBuildDto } from './dto/create-build.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { UserRole } from '../generated/prisma/enums';
import type { Prisma } from '../generated/prisma/client';

export interface VoteTally {
    positive: number;
    situational: number;
    negative: number;
}

export interface PublicBuild {
    id: string;
    title: string;
    heroId: string;
    items: string[];
    author: string;
    authorId: string;
    authorPicture: string | null;
    createdAt: string;
    votes: VoteTally;
    commentCount: number;
    authorReputation: number;
}

export interface FeedPage {
    items: PublicBuild[];
    total: number;
    page: number;
    pageSize: number;
}

const buildSelect = {
    id: true,
    title: true,
    heroId: true,
    items: true,
    createdAt: true,
    positiveVotes: true,
    situationalVotes: true,
    negativeVotes: true,
    author: { select: { id: true, displayName: true, picture: true } },
    _count: { select: { comments: { where: { deletedAt: null } } } },
} as const;

type BuildRow = Prisma.BuildGetPayload<{ select: typeof buildSelect }>;

@Injectable()
export class BuildsService {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly heroesService: HeroesService,
        private readonly itemsService: ItemsService,
    ) {}

    public async findFeed(query: FeedQueryDto): Promise<FeedPage> {
        const where = this.feedWhere(query);
        const skip = (query.page - 1) * query.pageSize;

        const [total, rows] = await this.prismaService.$transaction([
            this.prismaService.build.count({ where }),
            this.prismaService.build.findMany({
                where,
                orderBy:
                    query.sort === 'popular'
                        ? [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }]
                        : [{ createdAt: 'desc' }],
                skip,
                take: query.pageSize,
                select: buildSelect,
            }),
        ]);

        const reputation = await this.reputationFor(rows.map(row => row.author.id));

        return {
            items: rows.map(row => this.toPublic(row, reputation)),
            total,
            page: query.page,
            pageSize: query.pageSize,
        };
    }

    public async findOne(id: string): Promise<PublicBuild> {
        const build = await this.prismaService.build.findUnique({
            where: { id },
            select: buildSelect,
        });

        if (!build) {
            throw new NotFoundException(`Build "${id}" not found`);
        }

        return this.toPublic(build, await this.reputationFor([build.author.id]));
    }

    public async findRandom(): Promise<PublicBuild | null> {
        const total = await this.prismaService.build.count();

        if (total === 0) {
            return null;
        }

        const [build] = await this.prismaService.build.findMany({
            skip: Math.floor(Math.random() * total),
            take: 1,
            select: buildSelect,
        });

        return build ? this.toPublic(build, await this.reputationFor([build.author.id])) : null;
    }

    public async create(dto: CreateBuildDto, userId: string): Promise<PublicBuild> {
        this.assertCatalog(dto);

        const build = await this.prismaService.build.create({
            data: {
                title: dto.title,
                heroId: dto.heroId,
                items: JSON.stringify(dto.items),
                userId,
            },
            select: buildSelect,
        });

        return this.toPublic(build, await this.reputationFor([build.author.id]));
    }

    public async remove(id: string, viewer: { id: string; role: UserRole }): Promise<void> {
        const build = await this.prismaService.build.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!build) {
            throw new NotFoundException(`Build "${id}" not found`);
        }

        if (build.userId !== viewer.id && viewer.role !== UserRole.ADMIN) {
            throw new ForbiddenException('You can only delete your own builds.');
        }

        await this.prismaService.build.delete({ where: { id } });
    }

    private assertCatalog(dto: CreateBuildDto): void {
        if (!this.heroesService.exists(dto.heroId)) {
            throw new BadRequestException(`Unknown hero "${dto.heroId}".`);
        }

        const unknown = dto.items.filter(item => !this.itemsService.exists(item));

        if (unknown.length > 0) {
            throw new BadRequestException(`Unknown items: ${unknown.join(', ')}.`);
        }
    }

    private feedWhere(query: FeedQueryDto): Prisma.BuildWhereInput {
        const filters: Prisma.BuildWhereInput[] = [];

        if (query.author) {
            filters.push({ userId: query.author });
        }

        const hero = query.hero?.trim();

        if (hero && hero !== 'all') {
            filters.push({ heroId: hero });
        }

        const search = query.search?.trim();

        if (search) {
            const insensitive = { contains: search, mode: 'insensitive' } as const;

            filters.push({
                OR: [
                    { title: insensitive },
                    { author: { displayName: insensitive } },
                    { heroId: { in: this.heroesService.searchIds(search) } },
                ],
            });
        }

        return filters.length > 0 ? { AND: filters } : {};
    }

    private async reputationFor(authorIds: string[]): Promise<Map<string, number>> {
        const unique = [...new Set(authorIds)];

        if (unique.length === 0) {
            return new Map();
        }

        const totals = await this.prismaService.build.groupBy({
            by: ['userId'],
            where: { userId: { in: unique } },
            _sum: { positiveVotes: true },
        });

        return new Map(totals.map(row => [row.userId, row._sum.positiveVotes ?? 0]));
    }

    private toPublic(build: BuildRow, reputation: Map<string, number>): PublicBuild {
        return {
            id: build.id,
            title: build.title,
            heroId: build.heroId,
            items: this.parseItems(build.items),
            author: build.author.displayName,
            authorId: build.author.id,
            authorPicture: build.author.picture,
            createdAt: build.createdAt.toISOString(),
            votes: {
                positive: build.positiveVotes,
                situational: build.situationalVotes,
                negative: build.negativeVotes,
            },
            commentCount: build._count.comments,
            authorReputation: reputation.get(build.author.id) ?? 0,
        };
    }

    private parseItems(raw: string): string[] {
        try {
            const parsed: unknown = JSON.parse(raw);

            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            return [];
        }
    }
}
