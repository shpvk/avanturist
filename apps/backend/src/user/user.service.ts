import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthMethod, UserRole } from '../generated/prisma/enums';
import { User } from '../generated/prisma/client';
import { hash } from 'argon2';

export interface ActiveMute {
    until: Date | null;
    reason: string | null;
}

export interface PublicProfile {
    id: string;
    displayName: string;
    picture: string | null;
    role: UserRole;
    createdAt: string;
    buildCount: number;
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
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    public async publicProfile(id: string): Promise<PublicProfile> {
        const user = await this.prismaService.user.findUnique({
            where: { id },
            select: {
                id: true,
                displayName: true,
                picture: true,
                role: true,
                createdAt: true,
                _count: { select: { builds: true } },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            id: user.id,
            displayName: user.displayName,
            picture: user.picture,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            buildCount: user._count.builds,
        };
    }

    public async findByIdOrNull(id: string): Promise<User | null> {
        return this.prismaService.user.findUnique({ where: { id } });
    }

    public async findByEmail(email: string) {
        return this.prismaService.user.findUnique({
            where: { email: email.toLowerCase() },
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
        });
    }

    public async markVerified(id: string): Promise<User> {
        return this.prismaService.user.update({
            where: { id },
            data: { isVerified: true },
        });
    }

    public async updateDisplayName(
        id: string,
        displayName: string,
    ): Promise<User> {
        return this.prismaService.user.update({
            where: { id },
            data: { displayName },
        });
    }

    public async updateEmail(id: string, email: string): Promise<User> {
        return this.prismaService.user.update({
            where: { id },
            data: { email: email.toLowerCase(), isVerified: false },
        });
    }

    public async updatePicture(
        id: string,
        picture: string | null,
    ): Promise<User> {
        return this.prismaService.user.update({
            where: { id },
            data: { picture },
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
