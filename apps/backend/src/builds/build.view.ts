import { type Hero } from '../heroes/heroes.data';
import { emptyVerdictCounts, type VerdictCounts } from '../votes/verdict.enum';
import { type BuildEntity } from './build.entity';

/** Форма билда, которую отдаёт API: сущность + агрегаты сообщества. */
export type BuildView = {
    id: string;
    title: string;
    hero: Hero;
    items: string[];
    author: string;
    createdAt: Date;
    votes: VerdictCounts;
    commentsCount: number;
};

export function toBuildView(build: BuildEntity, hero: Hero): BuildView {
    const votes = emptyVerdictCounts();

    for (const vote of build.votes ?? []) {
        votes[vote.verdict] += 1;
    }

    return {
        id: build.id,
        title: build.title,
        hero,
        items: build.items,
        author: build.author,
        createdAt: build.createdAt,
        votes,
        commentsCount: build.comments?.length ?? 0,
    };
}
