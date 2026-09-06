import { heroRole } from "./hero-roles";
import { heroImageBase } from "./dota-cdn";
import type { ApiBuild, ApiComment, ApiHero, ApiVoteTally } from "./api-types";
import type { Build, BuildComment, HeroOption, VoteTally } from "./types";

const monthsGenitive = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const defaultAvatar = "/assets/heroes/community-avatar.webp";
const avatarPool = [
  defaultAvatar,
  "/assets/heroes/bloodseeker.png",
  "/assets/heroes/enigma.png",
  "/assets/heroes/leshrac.png",
  "/assets/heroes/shadow_shaman.png",
  "/assets/heroes/spirit_breaker.png",
];

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

export function formatBuildDate(createdAt: Date, now = new Date()): string {
  if (isSameDay(createdAt, now)) return "сегодня";
  return `${createdAt.getDate()} ${monthsGenitive[createdAt.getMonth()]} ${createdAt.getFullYear()}`;
}

export function formatCommentDate(createdAt: Date, now = new Date()): string {
  if (now.getTime() - createdAt.getTime() < justNowMs) return "только что";
  return `${createdAt.getDate()} ${monthsGenitive[createdAt.getMonth()]}`;
}

export function isoDay(createdAt: Date): string {
  const localMidnight = new Date(createdAt.getTime() - createdAt.getTimezoneOffset() * 60_000);
  return localMidnight.toISOString().slice(0, 10);
}

export function tallyVotes(votes: ApiVoteTally): VoteTally {
  const counts: VoteTally = [votes.positive, votes.situational, votes.negative];
  const total = counts[0] + counts[1] + counts[2];
  if (total === 0) return [0, 0, 0];

  return counts.map((count) => Math.round((count / total) * 100)) as VoteTally;
}

export function verdictFor(votes: VoteTally): { verdict: string; verdictType: string } {
  if (votes[0] + votes[1] + votes[2] === 0) return { verdict: "Нет оценок", verdictType: "neutral" };
  if (votes[0] >= recommendedShare) return { verdict: "Рекомендуется", verdictType: "recommended" };
  return { verdict: "Нейтрально", verdictType: "neutral" };
}

export function formatReputation(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function mapHeroes(heroes: ApiHero[]): HeroOption[] {
  return heroes.map((hero) => ({ id: hero.id, hero: hero.name, heroImage: hero.image, ...heroRole(hero.id, hero.roles) }));
}

export function formatMuteDeadline(until: string | null): string {
  if (!until) return "бессрочно";

  const deadline = new Date(until);
  const time = `${String(deadline.getHours()).padStart(2, "0")}:${String(deadline.getMinutes()).padStart(2, "0")}`;

  return `до ${deadline.getDate()} ${monthsGenitive[deadline.getMonth()]}, ${time}`;
}

export function mapComment(comment: ApiComment, now = new Date()): BuildComment {
  return {
    id: comment.id,
    author: comment.author,
    authorId: comment.authorId,
    avatar: authorAvatar(comment.author),
    date: formatCommentDate(new Date(comment.createdAt), now),
    text: comment.text,
    hidden: comment.isDeleted ?? false,
    authorMuted: comment.authorMuted ?? false,
    authorMutedUntil: comment.authorMutedUntil ?? null,
  };
}

export type MapBuildContext = {
  heroes: HeroOption[];
  reputation?: number;
  now?: Date;
};

export function mapBuild(build: ApiBuild, { heroes, reputation = 0, now = new Date() }: MapBuildContext): Build {
  const hero = heroes.find((option) => option.id === build.heroId);
  const createdAt = new Date(build.createdAt);
  const votes = tallyVotes(build.votes);

  return {
    id: build.id,
    heroId: build.heroId,
    hero: hero?.hero ?? build.heroId,
    heroImage: hero?.heroImage ?? `${heroImageBase}/${build.heroId}.png`,
    role: hero?.role ?? heroRole(build.heroId).role,
    roleClass: hero?.roleClass ?? heroRole(build.heroId).roleClass,
    title: build.title,
    items: build.items,
    author: build.author,
    authorId: build.authorId,
    avatar: authorAvatar(build.author),
    reputation: formatReputation(reputation),
    ...verdictFor(votes),
    votes,
    commentCount: build.commentCount,
    comments: [],
    date: formatBuildDate(createdAt, now),
    dateTime: isoDay(createdAt),
    createdAt: build.createdAt,
  };
}

export function mapFeed(builds: ApiBuild[], heroes: HeroOption[], now = new Date()): Build[] {
  return builds.map((build) => mapBuild(build, { heroes, reputation: build.authorReputation, now }));
}
