import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { ms, StringValue } from '../libs/common/utils/ms.util';
import { User } from '../generated/prisma/client';
import {
    JwtPayload,
    SessionMeta,
    TokenPair,
} from './interfaces/auth.interfaces';

interface ParsedRefreshToken {
    userId: string;
    jti: string;
    secret: string;
}

interface StoredSession {
    tokenHash: string;
    familyId: string;
    userAgent?: string;
    ip?: string;
    createdAt: string;
}

@Injectable()
export class TokenService {
    private readonly logger = new Logger(TokenService.name);

    private readonly prefix: string;
    private readonly accessTtlMs: number;
    private readonly refreshTtlSeconds: number;

    public constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly redisService: RedisService,
    ) {
        this.prefix = this.configService.get<string>('REFRESH_PREFIX') ?? 'refresh:';
        this.accessTtlMs = ms(
            this.configService.getOrThrow<StringValue>('JWT_ACCESS_TTL'),
        );
        this.refreshTtlSeconds = Math.floor(
            ms(this.configService.getOrThrow<StringValue>('JWT_REFRESH_TTL')) / 1000,
        );
    }

    public async issuePair(user: User, meta: SessionMeta): Promise<TokenPair> {
        return this.createPair(user, randomUUID(), meta);
    }

    public async rotate(
        rawToken: string,
        loadUser: (userId: string) => Promise<User | null>,
        meta: SessionMeta,
    ): Promise<{ tokens: TokenPair; user: User }> {
        const parsed = this.parse(rawToken);

        const session = await this.readSession(parsed);

        if (!session) {
            await this.handleMissingSession(parsed);

            throw new UnauthorizedException('Refresh token is invalid or expired.');
        }

        const user = await loadUser(parsed.userId);

        if (!user) {
            await this.revokeFamily(parsed.userId, session.familyId);

            throw new UnauthorizedException('Refresh token is invalid or expired.');
        }

        await this.consumeSession(parsed, session.familyId);

        return {
            tokens: await this.createPair(user, session.familyId, meta),
            user,
        };
    }

    public async revoke(rawToken: string): Promise<void> {
        let parsed: ParsedRefreshToken;

        try {
            parsed = this.parse(rawToken);
        } catch {
            return;
        }

        const session = await this.readSession(parsed);

        if (!session) {
            return;
        }

        await this.dropSession(parsed.userId, parsed.jti, session.familyId);
    }

    public async revokeAllForUser(userId: string): Promise<void> {
        const client = this.redisService.client;
        const userKey = this.userKey(userId);
        const sessionIds = await client.smembers(userKey);

        await this.markAccessRevoked(userId);

        if (sessionIds.length === 0) {
            await client.del(userKey);

            return;
        }

        const keys = sessionIds.flatMap(jti => [
            this.sessionKey(userId, jti),
            this.usedKey(userId, jti),
        ]);

        await client.del(...keys, userKey);
    }

    public async isAccessRevoked(
        userId: string,
        issuedAt?: number,
    ): Promise<boolean> {
        const raw = await this.redisService.client.get(
            this.killswitchKey(userId),
        );

        if (!raw) {
            return false;
        }

        return !issuedAt || issuedAt < Number(raw);
    }

    private async createPair(
        user: User,
        familyId: string,
        meta: SessionMeta,
    ): Promise<TokenPair> {
        const jti = randomUUID();
        const secret = randomBytes(32).toString('base64url');
        const refreshToken = `${user.id}.${jti}.${secret}`;

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            jti,
            familyId,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        const session: StoredSession = {
            tokenHash: this.hash(secret),
            familyId,
            userAgent: meta.userAgent,
            ip: meta.ip,
            createdAt: new Date().toISOString(),
        };

        const client = this.redisService.client;

        await client
            .multi()
            .set(
                this.sessionKey(user.id, jti),
                JSON.stringify(session),
                'EX',
                this.refreshTtlSeconds,
            )
            .sadd(this.userKey(user.id), jti)
            .expire(this.userKey(user.id), this.refreshTtlSeconds)
            .sadd(this.familyKey(familyId), jti)
            .expire(this.familyKey(familyId), this.refreshTtlSeconds)
            .exec();

        return {
            accessToken,
            refreshToken,
            expiresIn: Math.floor(this.accessTtlMs / 1000),
        };
    }

    private async handleMissingSession(parsed: ParsedRefreshToken): Promise<void> {
        const client = this.redisService.client;
        const used = await client.get(this.usedKey(parsed.userId, parsed.jti));

        if (!used) {
            return;
        }

        const [familyId, tokenHash] = used.split(':');

        if (tokenHash !== this.hash(parsed.secret)) {
            return;
        }

        this.logger.warn(
            `Refresh token reuse detected for user ${parsed.userId}, revoking family ${familyId}.`,
        );

        await this.revokeFamily(parsed.userId, familyId);
    }

    private async consumeSession(
        parsed: ParsedRefreshToken,
        familyId: string,
    ): Promise<void> {
        await this.redisService.client
            .multi()
            .del(this.sessionKey(parsed.userId, parsed.jti))
            .set(
                this.usedKey(parsed.userId, parsed.jti),
                `${familyId}:${this.hash(parsed.secret)}`,
                'EX',
                this.refreshTtlSeconds,
            )
            .exec();
    }

    private async markAccessRevoked(userId: string): Promise<void> {
        await this.redisService.client.set(
            this.killswitchKey(userId),
            String(Math.floor(Date.now() / 1000)),
            'EX',
            Math.max(1, Math.ceil(this.accessTtlMs / 1000)),
        );
    }

    private async dropSession(
        userId: string,
        jti: string,
        familyId: string,
    ): Promise<void> {
        await this.redisService.client
            .multi()
            .del(this.sessionKey(userId, jti))
            .del(this.usedKey(userId, jti))
            .srem(this.userKey(userId), jti)
            .srem(this.familyKey(familyId), jti)
            .exec();
    }

    private async revokeFamily(userId: string, familyId: string): Promise<void> {
        const client = this.redisService.client;
        const familyKey = this.familyKey(familyId);
        const sessionIds = await client.smembers(familyKey);

        const pipeline = client.multi();

        for (const jti of sessionIds) {
            pipeline
                .del(this.sessionKey(userId, jti))
                .del(this.usedKey(userId, jti))
                .srem(this.userKey(userId), jti);
        }

        pipeline.del(familyKey);

        await pipeline.exec();
    }

    private async readSession(
        parsed: ParsedRefreshToken,
    ): Promise<StoredSession | null> {
        const raw = await this.redisService.client.get(
            this.sessionKey(parsed.userId, parsed.jti),
        );

        if (!raw) {
            return null;
        }

        const session = JSON.parse(raw) as StoredSession;

        if (session.tokenHash !== this.hash(parsed.secret)) {
            await this.revokeFamily(parsed.userId, session.familyId);

            return null;
        }

        return session;
    }

    private parse(rawToken: string): ParsedRefreshToken {
        const parts = rawToken?.split('.') ?? [];

        if (parts.length !== 3 || parts.some(part => part.length === 0)) {
            throw new UnauthorizedException('Refresh token is malformed.');
        }

        const [userId, jti, secret] = parts;

        return { userId, jti, secret };
    }

    private hash(secret: string): string {
        return createHash('sha256').update(secret).digest('hex');
    }

    private sessionKey(userId: string, jti: string): string {
        return `${this.prefix}session:${userId}:${jti}`;
    }

    private usedKey(userId: string, jti: string): string {
        return `${this.prefix}used:${userId}:${jti}`;
    }

    private userKey(userId: string): string {
        return `${this.prefix}user:${userId}`;
    }

    private familyKey(familyId: string): string {
        return `${this.prefix}family:${familyId}`;
    }

    private killswitchKey(userId: string): string {
        return `${this.prefix}killswitch:${userId}`;
    }
}
