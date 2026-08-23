"use client";

import { useMemo } from "react";
import { BuildCard } from "./build-card";
import { roleOptions } from "../_lib/build-data";
import { reputationValue } from "../_lib/format";
import type { Build, FeedFilters } from "../_lib/types";

export const defaultFeedFilters: FeedFilters = { search: "", role: "all", sort: "new" };

type AllBuildsViewProps = {
  builds: Build[];
  filters: FeedFilters;
  onFiltersChange: (filters: FeedFilters) => void;
  onOpenBuild: (id: string) => void;
};

function matchesFilters(build: Build, filters: FeedFilters, search: string): boolean {
  const searchableText = `${build.hero} ${build.title} ${build.author}`.toLocaleLowerCase("ru-RU");
  const matchesSearch = !search || searchableText.includes(search);
  const matchesRole = filters.role === "all" || build.roleClass === filters.role;
  return matchesSearch && matchesRole;
}

export function AllBuildsView({ builds, filters, onFiltersChange, onOpenBuild }: AllBuildsViewProps) {
  const displayedBuilds = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase("ru-RU");
    const filtered = builds.filter((build) => matchesFilters(build, filters, search));
    // Array.prototype.sort is stable, so equal dates and equal vote shares keep feed order.
    return filters.sort === "popular"
      ? [...filtered].sort((first, second) => second.votes[0] - first.votes[0] || reputationValue(second.reputation) - reputationValue(first.reputation))
      : [...filtered].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }, [builds, filters]);

  const hasActiveFilters = filters.search.trim().length > 0 || filters.role !== "all" || filters.sort !== "new";
  const updateFilters = (patch: Partial<FeedFilters>) => onFiltersChange({ ...filters, ...patch });

  return (
    <main className="main-content all-builds-main">
      <div className="all-builds-heading"><div><h1>Все билды</h1><p>Экспериментальные сборки сообщества для всех ролей.</p></div><div className="feed-tabs" role="group" aria-label="Порядок билдов"><button className={filters.sort === "new" ? "active" : ""} type="button" aria-pressed={filters.sort === "new"} onClick={() => updateFilters({ sort: "new" })}>Новые</button><button className={filters.sort === "popular" ? "active" : ""} type="button" aria-pressed={filters.sort === "popular"} onClick={() => updateFilters({ sort: "popular" })}>Популярные</button></div></div>
      <section className="filters" aria-label="Фильтры билдов">
        <label className="search-field feed-search"><span className="sr-only">Поиск героя или билда</span><span className="search-icon" aria-hidden="true" /><input type="search" value={filters.search} onChange={(event) => updateFilters({ search: event.target.value })} placeholder="Герой или билд..." autoComplete="off" /></label>
        <label className="filter-field"><span>Позиция</span><select value={filters.role} onChange={(event) => updateFilters({ role: event.target.value as FeedFilters["role"] })}>{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <p className="result-count" role="status"><strong>{displayedBuilds.length}</strong> из {builds.length} билдов</p>
        <button className="reset-button" type="button" onClick={() => onFiltersChange(defaultFeedFilters)} disabled={!hasActiveFilters}><span aria-hidden="true">↻</span>Сбросить фильтры</button>
      </section>
      <section className="build-list" aria-label="Список билдов">
        {displayedBuilds.map((build, index) => <BuildCard build={build} index={index} key={build.id} onOpen={() => onOpenBuild(build.id)} />)}
        {displayedBuilds.length === 0 && <p className="empty-builds">Билдов с такими фильтрами пока нет. Попробуйте изменить запрос.</p>}
      </section>
    </main>
  );
}
