#!/usr/bin/env tsx
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../apps/backend/src/generated/prisma/client';

type ImportedBuild = {
    postId: number;
    title: string;
    heroId: string;
    items: string[];
    credit: string;
    sourceUrl: string;
};

type ImportFile = {
    profile: { displayName: string; email: string };
    builds: ImportedBuild[];
    skipped: Array<{ postId: number; title: string; reason: string }>;
};

const repositoryRoot = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

function catalogIds(file: string): Set<string> {
    const source = readFileSync(path.join(repositoryRoot, file), 'utf8');
    return new Set([...source.matchAll(/^\s*\{ id: '([^']+)'/gm)].map((match) => match[1]));
}

function loadEnv(): void {
    const envPath = path.join(repositoryRoot, '.env');
    if (existsSync(envPath)) process.loadEnvFile(envPath);
}

async function main(): Promise<void> {
    const data: ImportFile = JSON.parse(
        readFileSync(path.join(repositoryRoot, 'scripts/telegram-builds.json'), 'utf8'),
    );

    const heroes = catalogIds('apps/backend/src/heroes/heroes.data.ts');
    const items = catalogIds('apps/backend/src/items/items.data.ts');

    for (const build of data.builds) {
        if (!heroes.has(build.heroId)) {
            throw new Error(`${build.postId}: неизвестный герой ${build.heroId}`);
        }
        const unknown = build.items.filter((item) => !items.has(item));
        if (unknown.length) {
            throw new Error(`${build.postId}: неизвестные предметы ${unknown.join(', ')}`);
        }
    }

    console.log(`Сборок к импорту: ${data.builds.length}, пропущено при разборе: ${data.skipped.length}`);

    if (dryRun) {
        for (const build of data.builds) {
            console.log(`  ${build.title} — ${build.heroId}: ${build.items.join(', ')}`);
        }
        return;
    }

    loadEnv();
    const connectionString = process.env.POSTGRES_URI;
    if (!connectionString) throw new Error('POSTGRES_URI не задан: скопируйте .env.example в .env');

    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

    try {
        const author = await prisma.user.upsert({
            where: { email: data.profile.email },
            update: { displayName: data.profile.displayName },
            create: {
                email: data.profile.email,
                password: null,
                displayName: data.profile.displayName,
                method: 'CREDENTIALS',
                isVerified: true,
            },
        });

        let created = 0;
        let updated = 0;

        for (const build of data.builds) {
            const existing = await prisma.build.findFirst({
                where: { title: build.title, heroId: build.heroId, userId: author.id },
            });

            if (existing) {
                await prisma.build.update({
                    where: { id: existing.id },
                    data: { items: JSON.stringify(build.items) },
                });
                updated += 1;
            } else {
                await prisma.build.create({
                    data: {
                        title: build.title,
                        heroId: build.heroId,
                        items: JSON.stringify(build.items),
                        userId: author.id,
                    },
                });
                created += 1;
            }
        }

        console.log(`Профиль: ${author.displayName} (${author.id})`);
        console.log(`Добавлено: ${created}, обновлено: ${updated}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
