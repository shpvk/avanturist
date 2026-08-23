import { heroRole } from "./hero-roles";
import type { ApiBuild, ApiComment, ApiHero } from "./api-types";
import type { Build, BuildComment, HeroOption, VoteTally } from "./types";

const monthsGenitive = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** Avatars the API does not store: a stable pick per author keeps the feed recognisable. */
const defaultAvatar = "/assets/heroes/community-avatar.webp";
const avatarPool = [
  defaultAvatar,
  "/assets/heroes/bloodseeker.png",
  "/assets/heroes/enigma.png",
  "/assets/heroes/leshrac.png",
  "/assets/heroes/shadow_shaman.png",
  "/assets/heroes/spirit_breaker.png",
];

/** A build needs this share of likes before it is called recommended. */
const recommendedShare = 60;
const justNowMs = 60_000;

function hashCode(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) | 0;
  return Math.abs(hash);
}

export function authorAvatar(author: string): string {
  return avatarPool[hashCode(author) % avatarPool.length];
}

function isSameDay(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

/** "2026-08-21T09:12:00Z" -> "21 августа 2026", or "сегодня" for today's builds. */
export function formatBuildDate(createdAt: Date, now = new Date()): string {
  if (isSameDay(createdAt, now)) return "сегодня";
  return `${createdAt.getDate()} ${monthsGenitive[createdAt.getMonth()]} ${createdAt.getFullYear()}`;
}

/** Comments carry a shorter stamp, matching how the seeded thread reads. */
export function formatCommentDate(createdAt: Date, now = new Date()): string {
  if (now.getTime() - createdAt.getTime() < justNowMs) return "только что";
  return `${createdAt.getDate()} ${monthsGenitive[createdAt.getMonth()]}`;
}

export function isoDay(createdAt: Date): string {
  const localMidnight = new Date(createdAt.getTime() - createdAt.getTimezoneOffset() * 60_000);
  return localMidnight.toISOString().slice(0, 10);
}

/** Raw verdict rows -> the percentages the vote bar paints. */
export function tallyVotes(build: ApiBuild): VoteTally {
  const counts: VoteTally = [0, 0, 0];
  for (const vote of build.votes ?? []) {
    if (vote.verdict === "positive") counts[0] += 1;
    else if (vote.verdict === "situational") counts[1] += 1;
    else if (vote.verdict === "negative") counts[2] += 1;
  }

  const total = counts[0] + counts[1] + counts[2];
  if (total === 0) return counts;

  return counts.map((count) => Math.round((count / total) * 100)) as VoteTally;
}

/** The API has no verdict column, so the wording follows the tally. */
export function verdictFor(votes: VoteTally): { verdict: string; verdictType: string } {
  if (votes[0] + votes[1] + votes[2] === 0) return { verdict: "Нет оценок", verdictType: "neutral" };
  if (votes[0] >= recommendedShare) return { verdict: "Рекомендуется", verdictType: "recommended" };
  return { verdict: "Нейтрально", verdictType: "neutral" };
}

/** Reputation is not stored either: count the likes an author collected across the feed. */
export function reputationByAuthor(builds: ApiBuild[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const build of builds) {
    const likes = (build.votes ?? []).filter((vote) => vote.verdict === "positive").length;
    totals.set(build.author, (totals.get(build.author) ?? 0) + likes);
  }
  return totals;
}

export function formatReputation(value: number): string {
  // Grouped by hand: the runtime's locale data must not decide how a number renders.
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function mapHeroes(heroes: ApiHero[]): HeroOption[] {
  return heroes.map((hero) => ({ id: hero.id, hero: hero.name, heroImage: hero.image, ...heroRole(hero.id) }));
}

export function mapComment(comment: ApiComment, now = new Date()): BuildComment {
  return {
    id: comment.id,
    author: comment.author,
    avatar: authorAvatar(comment.author),
    date: formatCommentDate(new Date(comment.createdAt), now),
    text: comment.text,
  };
}

export type MapBuildContext = {
  heroes: HeroOption[];
  /** Author likes across the feed; supplied by the caller so one build can be remapped alone. */
  reputation?: number;
  now?: Date;
};

export function mapBuild(build: ApiBuild, { heroes, reputation = 0, now = new Date() }: MapBuildContext): Build {
  const hero = heroes.find((option) => option.id === build.heroId);
  const createdAt = new Date(build.createdAt);
  const votes = tallyVotes(build);
  const comments = [...(build.comments ?? [])]
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt))
    .map((comment) => mapComment(comment, now));

  return {
    id: build.id,
    heroId: build.heroId,
    hero: hero?.hero ?? build.heroId,
    heroImage: hero?.heroImage ?? `/assets/heroes/${build.heroId}.png`,
    role: hero?.role ?? heroRole(build.heroId).role,
    roleClass: hero?.roleClass ?? heroRole(build.heroId).roleClass,
    title: build.title,
    items: build.items,
    author: build.author,
    avatar: authorAvatar(build.author),
    reputation: formatReputation(reputation),
    ...verdictFor(votes),
    votes,
    comments,
    date: formatBuildDate(createdAt, now),
    dateTime: isoDay(createdAt),
    createdAt: build.createdAt,
  };
}

export function mapFeed(builds: ApiBuild[], heroes: HeroOption[], now = new Date()): Build[] {
  const reputation = reputationByAuthor(builds);
  return builds.map((build) => mapBuild(build, { heroes, reputation: reputation.get(build.author) ?? 0, now }));
}
