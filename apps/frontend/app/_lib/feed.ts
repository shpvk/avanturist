import { fetchBuild, fetchBuilds, fetchHeroes } from "./api";
import { mapBuild, mapFeed, mapHeroes } from "./api-mapping";
import { demoBuilds, demoHeroes } from "./build-data";
import { pageSize } from "./pagination";
import type { Build, HeroOption } from "./types";

export type FeedSnapshot = {
  builds: Build[];
  total: number;
  heroes: HeroOption[];
  source: "api" | "demo";
};

export async function loadBuild(buildId: string, heroes: HeroOption[]): Promise<Build | undefined> {
  try {
    return mapBuild(await fetchBuild(buildId), { heroes });
  } catch {
    return undefined;
  }
}

export async function loadFeed(): Promise<FeedSnapshot> {
  try {
    const [apiHeroes, feed] = await Promise.all([fetchHeroes(), fetchBuilds({ page: 1, pageSize })]);
    const heroes = mapHeroes(apiHeroes);
    return { builds: mapFeed(feed.items, heroes), total: feed.total, heroes, source: "api" };
  } catch {
    return { builds: demoBuilds, total: demoBuilds.length, heroes: demoHeroes, source: "demo" };
  }
}

export async function loadLandingBuilds(limit = 6): Promise<Build[]> {
  try {
    const [apiHeroes, feed] = await Promise.all([
      fetchHeroes(),
      fetchBuilds({ page: 1, pageSize: limit, sort: "popular" }),
    ]);
    return mapFeed(feed.items, mapHeroes(apiHeroes));
  } catch {
    return [];
  }
}
