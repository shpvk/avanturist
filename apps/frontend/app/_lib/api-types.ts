import type { Vote } from "./types";

/**
 * The shapes the Nest API actually returns (apps/backend/src). Kept apart from the view
 * model in `types.ts`: the API knows nothing about roles, avatars or verdict wording.
 */

export type ApiHero = {
  id: string;
  name: string;
  image: string;
  primaryAttr?: string;
  attackType?: string;
  /** OpenDota's role tags; the lane badge falls back to them. */
  roles?: string[];
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
  author: string;
  createdAt: string;
  votes?: ApiVote[];
  comments?: ApiComment[];
};

export type CreateBuildPayload = {
  title: string;
  heroId: string;
  items: string[];
  author?: string;
};

export type CreateVotePayload = {
  verdict: Vote;
  voterKey: string;
};

export type CreateCommentPayload = {
  author: string;
  text: string;
};

/** The signed-in account as /auth/me returns it — never a password hash. */
export type ApiAccount = {
  id: string;
  email: string;
  displayName: string;
  picture: string | null;
  role: string;
  createdAt: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  passwordRepeat: string;
};
