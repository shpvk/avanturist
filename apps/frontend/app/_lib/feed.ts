import { fetchBuilds, fetchHeroes } from "./api";
import { mapFeed, mapHeroes } from "./api-mapping";
import { demoBuilds, demoHeroes } from "./build-data";
import type { Build, HeroOption } from "./types";

export type FeedSnapshot = {
  builds: Build[];
  heroes: HeroOption[];
  /** "demo" means the API could not be reached and the page is showing seeded builds. */
  source: "api" | "demo";
};

/**
 * Server-side read of the whole feed: heroes and builds in one round trip each, mapped
 * into the view model. A failure is not fatal — the page falls back to the demo builds
 * rather than showing an empty shell.
 */
export async function loadFeed(): Promise<FeedSnapshot> {
  try {
    const [apiHeroes, apiBuilds] = await Promise.all([fetchHeroes(), fetchBuilds()]);
    const heroes = mapHeroes(apiHeroes);
    return { builds: mapFeed(apiBuilds, heroes), heroes, source: "api" };
  } catch {
    return { builds: demoBuilds, heroes: demoHeroes, source: "demo" };
  }
}
