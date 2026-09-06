import { NotFoundException } from '@nestjs/common';
import { VotesService } from '../votes.service';
import { Verdict } from '../verdict.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { BuildsService, PublicBuild } from '../../builds/builds.service';

const publicBuild = { id: 'build-1' } as PublicBuild;

function createService(options: { exists?: boolean; counts?: Array<{ verdict: string; _count: { _all: number } }> } = {}) {
    const { exists = true, counts = [] } = options;

    const tx = {
        build: {
            findUnique: jest.fn().mockResolvedValue(exists ? { id: 'build-1' } : null),
            update: jest.fn().mockResolvedValue({}),
        },
        vote: {
            upsert: jest.fn().mockResolvedValue({}),
            groupBy: jest.fn().mockResolvedValue(counts),
        },
    };

    const prisma = {
        $transaction: jest.fn(async (run: (client: typeof tx) => Promise<unknown>) => run(tx)),
    } as unknown as PrismaService;

    const buildsService = { findOne: jest.fn().mockResolvedValue(publicBuild) } as unknown as BuildsService;

    return { service: new VotesService(prisma, buildsService), tx, buildsService };
}

describe('VotesService.cast', () => {
    it('несуществующая сборка — 404', async () => {
        const { service, tx } = createService({ exists: false });

        await expect(
            service.cast('нет такой', { verdict: Verdict.Positive, voterKey: 'key-1' }),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(tx.vote.upsert).not.toHaveBeenCalled();
    });

    it('повторный голос тем же ключом переписывает прежний, а не добавляет второй', async () => {
        const { service, tx } = createService();

        await service.cast('build-1', { verdict: Verdict.Negative, voterKey: 'key-1' });

        expect(tx.vote.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { buildId_voterKey: { buildId: 'build-1', voterKey: 'key-1' } },
            }),
        );
    });

    it('вердикт уходит в базу в верхнем регистре, наружу остаётся нижний', async () => {
        const { service, tx } = createService();

        await service.cast('build-1', { verdict: Verdict.Situational, voterKey: 'key-1' });

        expect(tx.vote.upsert.mock.calls[0][0].create.verdict).toBe('SITUATIONAL');
    });

    it('голос без входа сохраняется без привязки к аккаунту', async () => {
        const { service, tx } = createService();

        await service.cast('build-1', { verdict: Verdict.Positive, voterKey: 'key-1' });

        expect(tx.vote.upsert.mock.calls[0][0].create.voterId).toBeNull();
    });

    it('вошедшему голос дополнительно привязывается к аккаунту', async () => {
        const { service, tx } = createService();

        await service.cast('build-1', { verdict: Verdict.Positive, voterKey: 'key-1' }, 'user-9');

        expect(tx.vote.upsert.mock.calls[0][0].create.voterId).toBe('user-9');
    });

    it('счётчики сборки пересчитываются по фактическим голосам', async () => {
        const { service, tx } = createService({
            counts: [
                { verdict: 'POSITIVE', _count: { _all: 4 } },
                { verdict: 'NEGATIVE', _count: { _all: 1 } },
            ],
        });

        await service.cast('build-1', { verdict: Verdict.Positive, voterKey: 'key-1' });

        expect(tx.build.update.mock.calls[0][0].data).toEqual({
            positiveVotes: 4,
            situationalVotes: 0,
            negativeVotes: 1,
        });
    });

    it('возвращает сборку целиком, чтобы клиенту хватило одного запроса', async () => {
        const { service, buildsService } = createService();

        const result = await service.cast('build-1', { verdict: Verdict.Positive, voterKey: 'key-1' });

        expect(buildsService.findOne).toHaveBeenCalledWith('build-1');
        expect(result).toBe(publicBuild);
    });
});
