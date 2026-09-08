export type View = "random" | "all";
export type Vote = "positive" | "situational" | "negative";
export type FeedSort = "new" | "popular";
export type RoleClass = "carry" | "offlane" | "support" | "mid";

export type VoteTally = [number, number, number];

export type BuildComment = {
  id: string;
  author: string;
  authorId?: string;
  avatar: string;
  date: string;
  text: string;
  hidden?: boolean;
  authorMuted?: boolean;
  authorMutedUntil?: string | null;
};

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
  authorId?: string;
  avatar: string;
  reputation: string;
  votes: VoteTally;
  commentCount: number;
  comments: BuildComment[];
  date: string;
  dateTime: string;
  createdAt: string;
};

export type FeedFilters = {
  search: string;
  hero: string;
  sort: FeedSort;
};
