import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthMethod } from '../generated/prisma/enums';
import { User } from '../generated/prisma/client';
import { hash } from 'argon2';

export interface ActiveMute {
    until: Date | null;
    reason: string | null;
}

export interface CreateUserInput {
    email: string;
    password: string | null;
    displayName: string;
    picture?: string | null;
    method: AuthMethod;
    isVerified: boolean;
}

@Injectable()
export class UserService {
    public constructor(private readonly prismaService: PrismaService) {}

    public async findById(id: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id },
            include: { accounts: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    public async findByIdOrNull(id: string): Promise<User | null> {
        return this.prismaService.user.findUnique({ where: { id } });
    }

    public async findByEmail(email: string) {
        return this.prismaService.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { accounts: true },
        });
    }

    public async create(input: CreateUserInput) {
        return this.prismaService.user.create({
            data: {
                email: input.email.toLowerCase(),
                password: input.password ? await hash(input.password) : null,
                displayName: input.displayName,
                picture: input.picture ?? null,
                method: input.method,
                isVerified: input.isVerified,
            },
            include: { accounts: true },
        });
    }

    public async findByProviderAccount(
        provider: string,
        providerAccountId: string,
    ): Promise<User | null> {
        const account = await this.prismaService.account.findUnique({
            where: {
                provider_providerAccountId: { provider, providerAccountId },
            },
            include: { user: true },
        });

        return account?.user ?? null;
    }

    public async linkAccount(input: {
        userId: string;
        provider: string;
        providerAccountId: string;
    }): Promise<void> {
        await this.prismaService.account.upsert({
            where: {
                provider_providerAccountId: {
                    provider: input.provider,
                    providerAccountId: input.providerAccountId,
                },
            },
            create: {
                userId: input.userId,
                type: 'oauth',
                provider: input.provider,
                providerAccountId: input.providerAccountId,
                accessToken: null,
                refreshToken: null,
                expiredAt: 0,
            },
            update: {
                accessToken: null,
                refreshToken: null,
                expiredAt: 0,
            },
        });
    }

    public async markVerified(id: string): Promise<User> {
        return this.prismaService.user.update({
            where: { id },
            data: { isVerified: true },
        });
    }

    public async updatePassword(id: string, password: string): Promise<User> {
        return this.prismaService.user.update({
            where: { id },
            data: { password: await hash(password) },
        });
    }

    public async activeMute(
        userId: string,
        now: Date = new Date(),
    ): Promise<ActiveMute | null> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: { mutedAt: true, mutedUntil: true, muteReason: true },
        });

        if (!user?.mutedAt) {
            return null;
        }

        if (user.mutedUntil && user.mutedUntil <= now) {
            await this.unmute(userId);

            return null;
        }

        return { until: user.mutedUntil, reason: user.muteReason };
    }

    public async mute(input: {
        userId: string;
        until: Date | null;
        reason: string | null;
        byId: string;
    }): Promise<User> {
        return this.prismaService.user.update({
            where: { id: input.userId },
            data: {
                mutedAt: new Date(),
                mutedUntil: input.until,
                muteReason: input.reason,
                mutedById: input.byId,
            },
        });
    }

    public async unmute(userId: string): Promise<User> {
        return this.prismaService.user.update({
            where: { id: userId },
            data: {
                mutedAt: null,
                mutedUntil: null,
                muteReason: null,
                mutedById: null,
            },
        });
    }
}
