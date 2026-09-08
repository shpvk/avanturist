import type { Vote } from "./types";

export type ApiHero = {
  id: string;
  name: string;
  image: string;
  primaryAttr?: string;
  attackType?: string;
  roles?: string[];
};

export type ApiVoteTally = {
  positive: number;
  situational: number;
  negative: number;
};

export type ApiComment = {
  id: string;
  buildId: string;
  author: string;
  authorId: string;
  authorPicture?: string | null;
  text: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  authorMuted?: boolean;
  authorMutedUntil?: string | null;
};

export type ApiBuild = {
  id: string;
  title: string;
  heroId: string;
  items: string[];
  author: string;
  authorId?: string;
  authorPicture?: string | null;
  createdAt: string;
  votes: ApiVoteTally;
  commentCount: number;
  authorReputation: number;
};

export type ApiUserProfile = {
  id: string;
  displayName: string;
  picture: string | null;
  role: "REGULAR" | "ADMIN";
  createdAt: string;
  buildCount: number;
};

export type ApiFeedPage = {
  items: ApiBuild[];
  total: number;
  page: number;
  pageSize: number;
};

export type FeedQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  hero?: string;
  sort?: "new" | "popular";
  author?: string;
};

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
  text: string;
};

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
