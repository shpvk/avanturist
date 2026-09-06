import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BuildsService } from '../builds.service';
import { FeedQueryDto } from '../dto/feed-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { HeroesService } from '../../heroes/heroes.service';
import { ItemsService } from '../../items/items.service';
import { UserRole } from '../../generated/prisma/enums';

type Row = {
    id: string;
    title: string;
    heroId: string;
    items: string;
    createdAt: Date;
    positiveVotes: number;
    situationalVotes: number;
    negativeVotes: number;
    author: { id: string; displayName: string };
    _count: { comments: number };
};

function row(overrides: Partial<Row> = {}): Row {
    return {
        id: 'build-1',
        title: 'Мясной таран',
        heroId: 'pudge',
        items: JSON.stringify(['blade_mail', 'heart']),
        createdAt: new Date('2026-01-05T12:00:00.000Z'),
        positiveVotes: 3,
        situationalVotes: 0,
        negativeVotes: 1,
        author: { id: 'user-1', displayName: 'HookMaster' },
        _count: { comments: 2 },
        ...overrides,
    };
}

function createService(rows: Row[] = [row()], total = rows.length) {
    const findMany = jest.fn().mockResolvedValue(rows);
    const count = jest.fn().mockResolvedValue(total);
    const create = jest.fn().mockResolvedValue(rows[0]);
    const findUnique = jest.fn().mockResolvedValue(rows[0] ?? null);
    const remove = jest.fn().mockResolvedValue(rows[0] ?? null);
    const groupBy = jest.fn().mockResolvedValue([
        { userId: 'user-1', _sum: { positiveVotes: 7 } },
    ]);

    const prisma = {
        build: { findMany, count, create, findUnique, groupBy, delete: remove },
        $transaction: jest.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    } as unknown as PrismaService;

    const service = new BuildsService(prisma, new HeroesService(), new ItemsService());

    return { service, findMany, count, create, findUnique, remove };
}

function owned() {
    return createService([row({ author: { id: 'user-1', displayName: 'HookMaster' } })]);
}

function viewer(id: string, role: UserRole = UserRole.REGULAR) {
    return { id, role };
}

function query(overrides: Partial<FeedQueryDto> = {}): FeedQueryDto {
    return Object.assign(new FeedQueryDto(), overrides);
}

describe('BuildsService.findFeed', () => {
    it('отдаёт страницу вместе с общим числом сборок', async () => {
        const { service } = createService([row()], 42);

        const page = await service.findFeed(query({ page: 2, pageSize: 10 }));

        expect(page.total).toBe(42);
        expect(page.page).toBe(2);
        expect(page.pageSize).toBe(10);
        expect(page.items).toHaveLength(1);
    });

    it('запрашивает у базы ровно одну страницу, а не всю таблицу', async () => {
        const { service, findMany } = createService();

        await service.findFeed(query({ page: 3, pageSize: 12 }));

        expect(findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 24, take: 12 }),
        );
    });

    it('сортировка по популярности идёт по счётчику голосов «за»', async () => {
        const { service, findMany } = createService();

        await service.findFeed(query({ sort: 'popular' }));

        expect(findMany.mock.calls[0][0].orderBy).toEqual([
            { positiveVotes: 'desc' },
            { createdAt: 'desc' },
        ]);
    });

    it('фильтр по герою уходит в запрос, а «all» ничего не сужает', async () => {
        const { service, findMany } = createService();

        await service.findFeed(query({ hero: 'pudge' }));
        expect(findMany.mock.calls[0][0].where).toEqual({ AND: [{ heroId: 'pudge' }] });

        await service.findFeed(query({ hero: 'all' }));
        expect(findMany.mock.calls[1][0].where).toEqual({});
    });

    it('поиск идёт и по названию, и по автору, и по имени героя', async () => {
        const { service, findMany } = createService();

        await service.findFeed(query({ search: 'pud' }));

        const clause = findMany.mock.calls[0][0].where.AND[0].OR;
        expect(clause).toHaveLength(3);
        expect(clause[2].heroId.in).toContain('pudge');
    });

    it('репутацию автора считает сервер, а не загруженная страница', async () => {
        const { service } = createService();

        const page = await service.findFeed(query());

        expect(page.items[0].authorReputation).toBe(7);
    });

    it('отдаёт счётчики голосов и число комментариев, а не сами строки', async () => {
        const { service } = createService();

        const [build] = (await service.findFeed(query())).items;

        expect(build.votes).toEqual({ positive: 3, situational: 0, negative: 1 });
        expect(build.commentCount).toBe(2);
    });

    it('битый JSON в предметах ленту не роняет', async () => {
        const { service } = createService([row({ items: 'не json' })]);

        const [build] = (await service.findFeed(query())).items;

        expect(build.items).toEqual([]);
    });
});

describe('BuildsService.create', () => {
    it('отклоняет несуществующего героя', async () => {
        const { service, create } = createService();

        await expect(
            service.create({ title: 'Тест', heroId: 'nope', items: ['heart'] }, 'user-1'),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(create).not.toHaveBeenCalled();
    });

    it('отклоняет предметы, которых нет в каталоге', async () => {
        const { service, create } = createService();

        await expect(
            service.create({ title: 'Тест', heroId: 'pudge', items: ['heart', 'нечто'] }, 'user-1'),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(create).not.toHaveBeenCalled();
    });

    it('сохраняет предметы одной JSON-строкой', async () => {
        const { service, create } = createService();

        await service.create({ title: 'Тест', heroId: 'pudge', items: ['heart'] }, 'user-1');

        expect(create.mock.calls[0][0].data).toMatchObject({
            heroId: 'pudge',
            items: JSON.stringify(['heart']),
            userId: 'user-1',
        });
    });
});

describe('BuildsService.findOne', () => {
    it('несуществующая сборка — 404, а не пустой ответ', async () => {
        const { service } = createService([]);

        await expect(service.findOne('нет такой')).rejects.toBeInstanceOf(NotFoundException);
    });
});

describe('BuildsService.remove', () => {
    it('автор удаляет свою сборку', async () => {
        const { service, remove, findUnique } = owned();
        findUnique.mockResolvedValue({ userId: 'user-1' });

        await service.remove('build-1', viewer('user-1'));

        expect(remove).toHaveBeenCalledWith({ where: { id: 'build-1' } });
    });

    it('чужую сборку обычный пользователь удалить не может', async () => {
        const { service, remove, findUnique } = owned();
        findUnique.mockResolvedValue({ userId: 'user-1' });

        await expect(service.remove('build-1', viewer('user-2'))).rejects.toBeInstanceOf(
            ForbiddenException,
        );
        expect(remove).not.toHaveBeenCalled();
    });

    it('администратор сносит любую сборку', async () => {
        const { service, remove, findUnique } = owned();
        findUnique.mockResolvedValue({ userId: 'user-1' });

        await service.remove('build-1', viewer('user-2', UserRole.ADMIN));

        expect(remove).toHaveBeenCalledWith({ where: { id: 'build-1' } });
    });

    it('несуществующая сборка — 404, а не тихий успех', async () => {
        const { service, remove, findUnique } = createService([]);
        findUnique.mockResolvedValue(null);

        await expect(service.remove('нет такой', viewer('user-1'))).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(remove).not.toHaveBeenCalled();
    });
});
