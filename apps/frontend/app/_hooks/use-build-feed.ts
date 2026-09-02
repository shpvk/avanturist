"use client";

import { useCallback, useMemo, useState } from "react";
import { ApiError, createBuild } from "../_lib/api";
import { mapBuild } from "../_lib/api-mapping";
import { createLocalBuild } from "../_lib/build-data";
import type { CreateBuildPayload } from "../_lib/api-types";
import type { Build, HeroOption } from "../_lib/types";

/** Picks a build other than `currentId`; with a single build there is nothing to pick. */
function pickNextBuildId(builds: Build[], currentId: string): string {
  if (builds.length < 2) return builds[0]?.id ?? currentId;
  const currentIndex = Math.max(builds.findIndex((build) => build.id === currentId), 0);
  const offset = 1 + Math.floor(Math.random() * (builds.length - 1));
  return builds[(currentIndex + offset) % builds.length].id;
}

export type BuildFeed = {
  builds: Build[];
  /** The build the random view is showing; the feed is never empty in practice. */
  currentBuild: Build | undefined;
  /** Replaces one build in place — the shape every write goes through. */
  replaceBuild: (id: string, update: (build: Build) => Build) => void;
  /** Rewrites the comments of every build: a mute reaches an author across the feed. */
  updateComments: (update: (build: Build) => Build) => void;
  showNextBuild: () => void;
  selectBuild: (id: string) => void;
  addBuild: (payload: CreateBuildPayload) => Promise<Build>;
};

/**
 * The feed itself: which builds exist and which one the random view shows. Votes and
 * comments write through `replaceBuild` instead of owning their own copy of the list.
 */
export function useBuildFeed(initialBuilds: Build[], heroes: HeroOption[]): BuildFeed {
  const [builds, setBuilds] = useState<Build[]>(initialBuilds);
  const [currentBuildId, setCurrentBuildId] = useState(initialBuilds[0]?.id ?? "");

  const currentBuild = useMemo(
    () => builds.find((build) => build.id === currentBuildId) ?? builds[0],
    [builds, currentBuildId],
  );

  const replaceBuild = useCallback((id: string, update: (build: Build) => Build) => {
    setBuilds((current) => current.map((build) => (build.id === id ? update(build) : build)));
  }, []);

  const updateComments = useCallback((update: (build: Build) => Build) => {
    setBuilds((current) => current.map(update));
  }, []);

  const showNextBuild = useCallback(() => {
    setCurrentBuildId((current) => pickNextBuildId(builds, current));
  }, [builds]);

  const addBuild = useCallback(async (payload: CreateBuildPayload): Promise<Build> => {
    const hero = heroes.find((option) => option.id === payload.heroId);
    if (!hero) throw new Error(`Unknown hero "${payload.heroId}"`);

    let build: Build;
    try {
      build = mapBuild(await createBuild(payload), { heroes });
    } catch (error) {
      // A rejected build is the author's problem to fix; an unreachable API is not.
      if (error instanceof ApiError) throw error;
      build = createLocalBuild(hero, payload.title, payload.items, new Date());
    }

    setBuilds((current) => [build, ...current]);
    setCurrentBuildId(build.id);

    return build;
  }, [heroes]);

  return {
    builds,
    currentBuild,
    replaceBuild,
    updateComments,
    showNextBuild,
    selectBuild: setCurrentBuildId,
    addBuild,
  };
}
