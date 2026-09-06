import { UserService } from '../user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { isMuted } from '../mute.util';

type UserRow = {
    mutedAt: Date | null;
    mutedUntil: Date | null;
    muteReason: string | null;
};

function serviceWith(stored: UserRow) {
    const update = jest.fn(async ({ data }: { data: Partial<UserRow> }) => {
        Object.assign(stored, data);
        return stored;
    });

    const prisma = {
        user: {
            findUnique: jest.fn().mockResolvedValue(stored),
            update,
        },
    } as unknown as PrismaService;

    return { service: new UserService(prisma), update };
}

describe('isMuted', () => {
    const now = new Date('2026-09-02T12:00:00.000Z');

    it('пустой `mutedAt` — мута нет', () => {
        expect(isMuted({ mutedAt: null, mutedUntil: null }, now)).toBe(false);
    });

    it('мут без срока действует бессрочно', () => {
        expect(isMuted({ mutedAt: new Date('2026-01-01'), mutedUntil: null }, now)).toBe(true);
    });

    it('срок в прошлом мут не продлевает', () => {
        expect(isMuted({ mutedAt: new Date('2026-01-01'), mutedUntil: new Date('2026-09-02T11:59:00.000Z') }, now)).toBe(false);
    });
});

describe('UserService.activeMute', () => {
    it('возвращает действующий мут со сроком и причиной', async () => {
        const until = new Date('2026-09-03T11:00:00.000Z');
        const { service } = serviceWith({ mutedAt: new Date('2026-09-02T11:00:00.000Z'), mutedUntil: until, muteReason: 'спам' });

        await expect(service.activeMute('user-1', new Date('2026-09-02T12:00:00.000Z')))
            .resolves.toEqual({ until, reason: 'спам' });
    });

    it('истёкший мут снимает, а не отдаёт как действующий', async () => {
        const stored: UserRow = {
            mutedAt: new Date('2026-09-01T11:00:00.000Z'),
            mutedUntil: new Date('2026-09-02T11:00:00.000Z'),
            muteReason: 'спам',
        };
        const { service, update } = serviceWith(stored);

        await expect(service.activeMute('user-1', new Date('2026-09-02T12:00:00.000Z'))).resolves.toBeNull();
        expect(update).toHaveBeenCalledTimes(1);
        expect(stored).toEqual({ mutedAt: null, mutedUntil: null, muteReason: null, mutedById: null });
    });

    it('у пользователя без мута в базу за снятием не ходит', async () => {
        const { service, update } = serviceWith({ mutedAt: null, mutedUntil: null, muteReason: null });

        await expect(service.activeMute('user-1')).resolves.toBeNull();
        expect(update).not.toHaveBeenCalled();
    });
});
