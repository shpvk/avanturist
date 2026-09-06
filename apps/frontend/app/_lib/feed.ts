import { fetchBuilds, fetchHeroes } from "./api";
import { mapFeed, mapHeroes } from "./api-mapping";
import { demoBuilds, demoHeroes } from "./build-data";
import { pageSize } from "../_hooks/use-build-feed";
import type { Build, HeroOption } from "./types";

export type FeedSnapshot = {
  builds: Build[];
  total: number;
  heroes: HeroOption[];
  source: "api" | "demo";
};

export async function loadFeed(): Promise<FeedSnapshot> {
  try {
    const [apiHeroes, feed] = await Promise.all([fetchHeroes(), fetchBuilds({ page: 1, pageSize })]);
    const heroes = mapHeroes(apiHeroes);
    return { builds: mapFeed(feed.items, heroes), total: feed.total, heroes, source: "api" };
  } catch {
    return { builds: demoBuilds, total: demoBuilds.length, heroes: demoHeroes, source: "demo" };
  }
}
