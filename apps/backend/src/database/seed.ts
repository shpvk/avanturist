import 'reflect-metadata';
import { BuildEntity } from '../builds/build.entity';
import { CommentEntity } from '../comments/comment.entity';
import { VoteEntity } from '../votes/vote.entity';
import { loadRootEnv } from '../load-env';
import { createDataSource } from './data-source';
import { seedBuilds } from './seed-data';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function seed(): Promise<void> {
    loadRootEnv();

    const dataSource = await createDataSource().initialize();
    const builds = dataSource.getRepository(BuildEntity);
    const votes = dataSource.getRepository(VoteEntity);
    const comments = dataSource.getRepository(CommentEntity);

    // Наполнение заменяет содержимое таблиц целиком.
    await dataSource.query('TRUNCATE builds, votes, comments RESTART IDENTITY CASCADE');

    const now = Date.now();
    let voteCount = 0;
    let commentCount = 0;

    for (const seedBuild of seedBuilds) {
        const publishedAt = new Date(now - seedBuild.daysAgo * DAY);

        const build = await builds.save(
            builds.create({
                title: seedBuild.title,
                heroId: seedBuild.heroId,
                items: seedBuild.items,
                author: seedBuild.author,
                createdAt: publishedAt,
            }),
        );

        await votes.save(
            seedBuild.votes.map((vote) =>
                votes.create({
                    buildId: build.id,
                    verdict: vote.verdict,
                    voterKey: vote.voterKey,
                    createdAt: new Date(publishedAt.getTime() + vote.hoursAfter * HOUR),
                }),
            ),
        );

        await comments.save(
            seedBuild.comments.map((comment) =>
                comments.create({
                    buildId: build.id,
                    author: comment.author,
                    text: comment.text,
                    createdAt: new Date(publishedAt.getTime() + comment.hoursAfter * HOUR),
                }),
            ),
        );

        voteCount += seedBuild.votes.length;
        commentCount += seedBuild.comments.length;
        console.log(`+ ${seedBuild.title} — ${seedBuild.votes.length} оценок, ${seedBuild.comments.length} комментариев`);
    }

    await dataSource.destroy();
    console.log(`\nГотово: ${seedBuilds.length} сборок, ${voteCount} оценок, ${commentCount} комментариев.`);
}

seed().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
