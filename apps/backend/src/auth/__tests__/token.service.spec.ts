import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../token.service';
import { User } from '../../generated/prisma/client';

/**
 * Минимальный in-memory Redis: строки, множества и TTL нам не важны,
 * важна логика ротации и отзыва семьи токенов.
 */
class FakeRedis {
    private strings = new Map<string, string>();
    private sets = new Map<string, Set<string>>();

    public async get(key: string): Promise<string | null> {
        return this.strings.get(key) ?? null;
    }

    public async set(key: string, value: string): Promise<void> {
        this.strings.set(key, value);
    }

    public async getdel(key: string): Promise<string | null> {
        const value = this.strings.get(key) ?? null;
        this.strings.delete(key);

        return value;
    }

    public async smembers(key: string): Promise<string[]> {
        return [...(this.sets.get(key) ?? [])];
    }

    public async del(...keys: string[]): Promise<void> {
        for (const key of keys) {
            this.strings.delete(key);
            this.sets.delete(key);
        }
    }

    public multi() {
        const ops: Array<() => void> = [];

        const chain = {
            set: (key: string, value: string) => {
                ops.push(() => this.strings.set(key, value));

                return chain;
            },
            del: (...keys: string[]) => {
                ops.push(() => keys.forEach(key => {
                    this.strings.delete(key);
                    this.sets.delete(key);
                }));

                return chain;
            },
            sadd: (key: string, member: string) => {
                ops.push(() => {
                    const set = this.sets.get(key) ?? new Set<string>();
                    set.add(member);
                    this.sets.set(key, set);
                });

                return chain;
            },
            srem: (key: string, member: string) => {
                ops.push(() => this.sets.get(key)?.delete(member));

                return chain;
            },
            expire: () => chain,
            exec: async () => {
                ops.forEach(op => op());

                return [];
            },
        };

        return chain;
    }
}

const user = {
    id: 'user-1',
    email: 'tester@example.com',
    role: 'REGULAR',
    isVerified: true,
} as User;

function createService() {
    const redis = new FakeRedis();

    const jwtService = {
        signAsync: jest.fn().mockResolvedValue('access.token.stub'),
    };

    const configService = {
        get: (key: string) => (key === 'REFRESH_PREFIX' ? 'refresh:' : undefined),
        getOrThrow: (key: string) =>
            key === 'JWT_ACCESS_TTL' ? '15m' : '30d',
    };

    const service = new TokenService(
        jwtService as never,
        configService as never,
        { client: redis } as never,
    );

    return { service, redis };
}

const loadUser = async () => user;

describe('TokenService', () => {
    it('выдаёт пару и кладёт userId с jti в сам refresh-токен', async () => {
        const { service } = createService();

        const pair = await service.issuePair(user, {});

        expect(pair.accessToken).toBe('access.token.stub');
        expect(pair.expiresIn).toBe(900);
        expect(pair.refreshToken.split('.')).toHaveLength(3);
        expect(pair.refreshToken.startsWith(`${user.id}.`)).toBe(true);
    });

    it('ротирует токен: старый перестаёт работать, новый выдаётся', async () => {
        const { service } = createService();

        const first = await service.issuePair(user, {});
        const second = await service.rotate(first.refreshToken, loadUser, {});

        expect(second.tokens.refreshToken).not.toBe(first.refreshToken);
        expect(second.user.id).toBe(user.id);

        await expect(
            service.rotate(first.refreshToken, loadUser, {}),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('на переиспользование отозванного токена гасит всю семью', async () => {
        const { service } = createService();

        const first = await service.issuePair(user, {});
        const second = await service.rotate(first.refreshToken, loadUser, {});

        // Атакующий предъявляет украденный старый токен.
        await expect(
            service.rotate(first.refreshToken, loadUser, {}),
        ).rejects.toBeInstanceOf(UnauthorizedException);

        // Живой токен законного владельца тоже больше не действует.
        await expect(
            service.rotate(second.tokens.refreshToken, loadUser, {}),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('не трогает соседние устройства при отзыве одной семьи', async () => {
        const { service } = createService();

        const phone = await service.issuePair(user, {});
        const laptop = await service.issuePair(user, {});

        await service.rotate(phone.refreshToken, loadUser, {});
        await expect(
            service.rotate(phone.refreshToken, loadUser, {}),
        ).rejects.toBeInstanceOf(UnauthorizedException);

        const stillWorks = await service.rotate(laptop.refreshToken, loadUser, {});

        expect(stillWorks.tokens.refreshToken).toBeTruthy();
    });

    it('logout гасит только текущую сессию', async () => {
        const { service } = createService();

        const session = await service.issuePair(user, {});

        await service.revoke(session.refreshToken);

        await expect(
            service.rotate(session.refreshToken, loadUser, {}),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('logout-all гасит все устройства пользователя', async () => {
        const { service } = createService();

        const phone = await service.issuePair(user, {});
        const laptop = await service.issuePair(user, {});

        await service.revokeAllForUser(user.id);

        await expect(
            service.rotate(phone.refreshToken, loadUser, {}),
        ).rejects.toBeInstanceOf(UnauthorizedException);
        await expect(
            service.rotate(laptop.refreshToken, loadUser, {}),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('отклоняет мусор вместо токена', async () => {
        const { service } = createService();

        await expect(service.rotate('not-a-token', loadUser, {})).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });

    it('обменивает одноразовый код на пару ровно один раз', async () => {
        const { service } = createService();

        const pair = await service.issuePair(user, {});
        const code = await service.stashForExchange(pair, user.id);

        const claimed = await service.claimExchange(code);

        expect(claimed.refreshToken).toBe(pair.refreshToken);
        expect(claimed.userId).toBe(user.id);

        await expect(service.claimExchange(code)).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });
});
