"use client";

import { useMemo, useState } from "react";
import { BuildCard } from "./build-card";
import { Pagination } from "./pagination";
import { reputationValue } from "../_lib/format";
import type { Build, FeedFilters, HeroOption } from "../_lib/types";

export const defaultFeedFilters: FeedFilters = { search: "", hero: "all", sort: "new" };

/** Cards per page: four rows of the three-column desktop grid. */
const pageSize = 12;

type AllBuildsViewProps = {
  builds: Build[];
  heroes: HeroOption[];
  filters: FeedFilters;
  onFiltersChange: (filters: FeedFilters) => void;
  onOpenBuild: (id: string) => void;
};

function matchesFilters(build: Build, filters: FeedFilters, search: string): boolean {
  const searchableText = `${build.hero} ${build.title} ${build.author}`.toLocaleLowerCase("ru-RU");
  const matchesSearch = !search || searchableText.includes(search);
  const matchesHero = filters.hero === "all" || build.heroId === filters.hero;
  return matchesSearch && matchesHero;
}

export function AllBuildsView({ builds, heroes, filters, onFiltersChange, onOpenBuild }: AllBuildsViewProps) {
  const [page, setPage] = useState(1);

  const displayedBuilds = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase("ru-RU");
    const filtered = builds.filter((build) => matchesFilters(build, filters, search));
    // Array.prototype.sort is stable, so equal dates and equal vote shares keep feed order.
    return filters.sort === "popular"
      ? [...filtered].sort((first, second) => second.votes[0] - first.votes[0] || reputationValue(second.reputation) - reputationValue(first.reputation))
      : [...filtered].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }, [builds, filters]);

  const heroOptions = useMemo(
    () => [...heroes].sort((first, second) => first.hero.localeCompare(second.hero, "en")),
    [heroes],
  );

  const pageCount = Math.max(Math.ceil(displayedBuilds.length / pageSize), 1);
  // Filters can shrink the feed under the open page, so the pager clamps instead of blanking.
  const currentPage = Math.min(page, pageCount);
  const pageBuilds = displayedBuilds.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const updateFilters = (patch: Partial<FeedFilters>) => {
    setPage(1);
    onFiltersChange({ ...filters, ...patch });
  };

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="all-builds-main">
      <h1 className="feed-heading">Билды</h1>
      <section className="feed-controls" aria-label="Фильтры билдов">
        <label className="search-field feed-search">
          <span className="sr-only">Поиск героя или билда</span>
          <span className="search-icon" aria-hidden="true" />
          <input type="search" value={filters.search} onChange={(event) => updateFilters({ search: event.target.value })} placeholder="Герой или название билда" autoComplete="off" />
        </label>
        <label className="feed-hero-filter">
          <span className="sr-only">Герой</span>
          <select value={filters.hero} onChange={(event) => updateFilters({ hero: event.target.value })}>
            <option value="all">Все герои</option>
            {heroOptions.map((hero) => <option key={hero.id} value={hero.id}>{hero.hero}</option>)}
          </select>
        </label>
        <div className="feed-tabs" role="group" aria-label="Порядок билдов">
          <button className={filters.sort === "new" ? "active" : ""} type="button" aria-pressed={filters.sort === "new"} onClick={() => updateFilters({ sort: "new" })}>Новые</button>
          <button className={filters.sort === "popular" ? "active" : ""} type="button" aria-pressed={filters.sort === "popular"} onClick={() => updateFilters({ sort: "popular" })}>Популярные</button>
        </div>
      </section>
      <section className="build-list" aria-label="Список билдов">
        {pageBuilds.map((build, index) => <BuildCard build={build} index={index} key={build.id} onOpen={() => onOpenBuild(build.id)} />)}
      </section>
      {displayedBuilds.length === 0 && <p className="empty-builds">Билдов с такими фильтрами пока нет. Попробуйте изменить запрос.</p>}
      <Pagination page={currentPage} pageCount={pageCount} onChange={goToPage} />
    </main>
  );
}
