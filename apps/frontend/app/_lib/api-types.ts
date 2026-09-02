import type { Vote } from "./types";

/**
 * The shapes the Nest API actually returns (apps/backend/src). Kept apart from the view
 * model in `types.ts`: the API knows nothing about roles, avatars or verdict wording.
 */

export type ApiHero = {
  id: string;
  name: string;
  image: string;
};

export type ApiVote = {
  id: string;
  buildId: string;
  verdict: Vote;
  createdAt: string;
};

export type ApiComment = {
  id: string;
  buildId: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: string;
  /** Ниже — поля модерации: API присылает их только администратору. */
  isDeleted?: boolean;
  deletedAt?: string | null;
  authorMuted?: boolean;
  /** `null` при бессрочном муте — вместе с `authorMuted: true`. */
  authorMutedUntil?: string | null;
};

export type ApiBuild = {
  id: string;
  title: string;
  heroId: string;
  items: string[];
  /** Отображаемое имя автора; `authorId` — его идентификатор в базе. */
  author: string;
  authorId?: string;
  createdAt: string;
  votes?: ApiVote[];
  comments?: ApiComment[];
};

/** Автора сервер берёт из access-токена, клиент его не передаёт. */
export type CreateBuildPayload = {
  title: string;
  heroId: string;
  items: string[];
};

export type CreateVotePayload = {
  verdict: Vote;
  voterKey: string;
};

/** Автора сервер берёт из access-токена, как и у билда. */
export type CreateCommentPayload = {
  text: string;
};

/** Мут: срок в минутах, без него — бессрочно. */
export type MutePayload = {
  minutes?: number;
  reason?: string;
};

export type ApiMute = {
  userId: string;
  muted: boolean;
  mutedUntil: string | null;
  reason: string | null;
};
