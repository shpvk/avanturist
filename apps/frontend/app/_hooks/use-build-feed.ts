"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, createBuild, deleteBuild, fetchBuilds, fetchRandomBuild } from "../_lib/api";
import { mapBuild, mapFeed } from "../_lib/api-mapping";
import { createLocalBuild } from "../_lib/build-data";
import type { CreateBuildPayload } from "../_lib/api-types";
import type { Build, FeedFilters, HeroOption } from "../_lib/types";

export const pageSize = 12;

const searchDebounceMs = 300;

export const defaultFeedFilters: FeedFilters = { search: "", hero: "all", sort: "new" };

export type BuildFeed = {
    builds: Build[];
    total: number;
    page: number;
    pageSize: number;
    filters: FeedFilters;
    isLoading: boolean;
    currentBuild: Build | undefined;
    updateFilters: (patch: Partial<FeedFilters>) => void;
    goToPage: (page: number) => void;
    replaceBuild: (id: string, update: (build: Build) => Build) => void;
    updateComments: (update: (build: Build) => Build) => void;
    showNextBuild: () => void;
    showPreviousBuild: () => void;
    canGoBack: boolean;
    selectBuild: (id: string) => void;
    addBuild: (payload: CreateBuildPayload) => Promise<Build>;
    removeBuild: (id: string) => Promise<void>;
};

type BuildFeedInput = {
    initialBuilds: Build[];
    initialTotal: number;
    heroes: HeroOption[];
};

export function useBuildFeed({ initialBuilds, initialTotal, heroes }: BuildFeedInput): BuildFeed {
    const [builds, setBuilds] = useState<Build[]>(initialBuilds);
    const [total, setTotal] = useState(initialTotal);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<FeedFilters>(defaultFeedFilters);
    const [isLoading, setIsLoading] = useState(false);
    const [currentBuild, setCurrentBuild] = useState<Build | undefined>(initialBuilds[0]);
    const [history, setHistory] = useState<Build[]>([]);

    const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(filters.search), searchDebounceMs);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const skipInitialFetch = useRef(true);

    useEffect(() => {
        if (skipInitialFetch.current) {
            skipInitialFetch.current = false;
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        fetchBuilds({ page, pageSize, search: debouncedSearch, hero: filters.hero, sort: filters.sort })
            .then((response) => {
                if (cancelled) return;
                setBuilds(mapFeed(response.items, heroes));
                setTotal(response.total);
            })
            .catch(() => {
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [page, debouncedSearch, filters.hero, filters.sort, heroes]);

    const updateFilters = useCallback((patch: Partial<FeedFilters>) => {
        setPage(1);
        setFilters((current) => ({ ...current, ...patch }));
    }, []);

    const goToPage = useCallback((next: number) => {
        setPage(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const replaceBuild = useCallback((id: string, update: (build: Build) => Build) => {
        setBuilds((current) => current.map((build) => (build.id === id ? update(build) : build)));
        setCurrentBuild((current) => (current && current.id === id ? update(current) : current));
    }, []);

    const updateComments = useCallback((update: (build: Build) => Build) => {
        setBuilds((current) => current.map(update));
        setCurrentBuild((current) => (current ? update(current) : current));
    }, []);

    const goToBuild = useCallback((next: Build | undefined) => {
        if (!next || next.id === currentBuild?.id) return;
        if (currentBuild) setHistory((past) => [...past, currentBuild]);
        setCurrentBuild(next);
    }, [currentBuild]);

    const showNextBuild = useCallback(() => {
        fetchRandomBuild()
            .then((build) => goToBuild(mapBuild(build, { heroes })))
            .catch(() => {
                if (builds.length < 2) return;
                const index = Math.max(builds.findIndex((build) => build.id === currentBuild?.id), 0);
                const offset = 1 + Math.floor(Math.random() * (builds.length - 1));
                goToBuild(builds[(index + offset) % builds.length]);
            });
    }, [builds, currentBuild, goToBuild, heroes]);

    const showPreviousBuild = useCallback(() => {
        const previous = history.at(-1);
        if (!previous) return;
        setHistory((past) => past.slice(0, -1));
        setCurrentBuild(previous);
    }, [history]);

    const selectBuild = useCallback((id: string) => {
        goToBuild(builds.find((build) => build.id === id));
    }, [builds, goToBuild]);

    const addBuild = useCallback(async (payload: CreateBuildPayload): Promise<Build> => {
        const hero = heroes.find((option) => option.id === payload.heroId);
        if (!hero) throw new Error(`Unknown hero "${payload.heroId}"`);

        let build: Build;
        try {
            build = mapBuild(await createBuild(payload), { heroes });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            build = createLocalBuild(hero, payload.title, payload.items, new Date());
        }

        setBuilds((current) => [build, ...current]);
        setTotal((current) => current + 1);
        setCurrentBuild(build);

        return build;
    }, [heroes]);

    const removeBuild = useCallback(async (id: string) => {
        await deleteBuild(id);

        setBuilds((current) => current.filter((build) => build.id !== id));
        setTotal((current) => Math.max(current - 1, 0));
        setHistory((past) => past.filter((build) => build.id !== id));
        setCurrentBuild((current) =>
            current?.id === id ? builds.find((build) => build.id !== id) : current,
        );
    }, [builds]);

    return {
        builds,
        total,
        page,
        pageSize,
        filters,
        isLoading,
        currentBuild,
        updateFilters,
        goToPage,
        replaceBuild,
        updateComments,
        showNextBuild,
        showPreviousBuild,
        canGoBack: history.length > 0,
        selectBuild,
        addBuild,
        removeBuild,
    };
}
