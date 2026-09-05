import type { ItemCategory } from "./dota-items";

export type View = "random" | "all";
export type Vote = "positive" | "situational" | "negative";
export type Theme = "dark" | "light";
export type FeedSort = "new" | "popular";
export type RoleClass = "carry" | "offlane" | "support" | "mid";
/** The item picker's category tabs: one per catalog category, plus "show everything". */
export type ItemFilter = "all" | ItemCategory;

/** Like / situational / dislike, in the order the vote bar paints them. */
export type VoteTally = [number, number, number];

export type AuthUser = {
  name: string;
  email: string;
};

export type BuildComment = {
  id: string;
  author: string;
  avatar: string;
  date: string;
  text: string;
};

/** A hero as the UI needs it: API identity plus the role badge the API has no opinion on. */
export type HeroOption = {
  id: string;
  hero: string;
  heroImage: string;
  role: string;
  roleClass: RoleClass;
};

export type Build = {
  id: string;
  heroId: string;
  hero: string;
  heroImage: string;
  role: string;
  roleClass: RoleClass;
  title: string;
  items: string[];
  author: string;
  avatar: string;
  reputation: string;
  verdict: string;
  verdictType: string;
  votes: VoteTally;
  comments: BuildComment[];
  /** Display date ("20 мая 2024" / "сегодня") and its machine-readable day. */
  date: string;
  dateTime: string;
  /** Full ISO timestamp — what the feed actually sorts on. */
  createdAt: string;
};

/** Filters for the "Билды" feed, kept in one object so they survive view switches. */
export type FeedFilters = {
  search: string;
  /** A hero id, or "all" for the whole feed. */
  hero: string;
  sort: FeedSort;
};
