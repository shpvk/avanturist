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
  text: string;
  createdAt: string;
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

export type CreateCommentPayload = {
  author: string;
  text: string;
};
