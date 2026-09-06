"use client";

import { useMemo } from "react";
import { BuildCard } from "./build-card";
import { Pagination } from "./pagination";
import { useAuth } from "../_hooks/use-auth";
import { canDeleteBuild } from "../_lib/ownership";
import type { Build, FeedFilters, HeroOption } from "../_lib/types";

type AllBuildsViewProps = {
  builds: Build[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  heroes: HeroOption[];
  filters: FeedFilters;
  onFiltersChange: (patch: Partial<FeedFilters>) => void;
  onPageChange: (page: number) => void;
  onOpenBuild: (id: string) => void;
  onDeleteBuild: (id: string) => Promise<void>;
};

export function AllBuildsView({
  builds,
  total,
  page,
  pageSize,
  isLoading,
  heroes,
  filters,
  onFiltersChange,
  onPageChange,
  onOpenBuild,
  onDeleteBuild,
}: AllBuildsViewProps) {
  const { user } = useAuth();
  const heroOptions = useMemo(
    () => [...heroes].sort((first, second) => first.hero.localeCompare(second.hero, "en")),
    [heroes],
  );

  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <main className="all-builds-main">
      <h1 className="feed-heading">Билды</h1>
      <section className="feed-controls" aria-label="Фильтры билдов">
        <label className="search-field feed-search">
          <span className="sr-only">Поиск героя или билда</span>
          <span className="search-icon" aria-hidden="true" />
          <input type="search" value={filters.search} onChange={(event) => onFiltersChange({ search: event.target.value })} placeholder="Герой или название билда" autoComplete="off" />
        </label>
        <label className="feed-hero-filter">
          <span className="sr-only">Герой</span>
          <select value={filters.hero} onChange={(event) => onFiltersChange({ hero: event.target.value })}>
            <option value="all">Все герои</option>
            {heroOptions.map((hero) => <option key={hero.id} value={hero.id}>{hero.hero}</option>)}
          </select>
        </label>
        <div className="feed-tabs" role="group" aria-label="Порядок билдов">
          <button className={filters.sort === "new" ? "active" : ""} type="button" aria-pressed={filters.sort === "new"} onClick={() => onFiltersChange({ sort: "new" })}>Новые</button>
          <button className={filters.sort === "popular" ? "active" : ""} type="button" aria-pressed={filters.sort === "popular"} onClick={() => onFiltersChange({ sort: "popular" })}>Популярные</button>
        </div>
      </section>
      <section className="build-list" aria-label="Список билдов" aria-busy={isLoading}>
        {builds.map((build, index) => (
          <BuildCard
            build={build}
            index={index}
            key={build.id}
            onOpen={() => onOpenBuild(build.id)}
            canDelete={canDeleteBuild(build, user)}
            onDelete={() => onDeleteBuild(build.id)}
          />
        ))}
      </section>
      {builds.length === 0 && !isLoading && <p className="empty-builds">Билдов с такими фильтрами пока нет. Попробуйте изменить запрос.</p>}
      <Pagination page={page} pageCount={pageCount} onChange={onPageChange} />
    </main>
  );
}
