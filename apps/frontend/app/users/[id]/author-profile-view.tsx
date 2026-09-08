"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BuildCard } from "../../_components/build-card";
import { Pagination } from "../../_components/pagination";
import { SiteHeader } from "../../_components/site-header";
import { useAuth } from "../../_hooks/use-auth";
import { pageSize } from "../../_lib/pagination";
import { deleteBuild, fetchBuilds } from "../../_lib/api";
import { mapFeed } from "../../_lib/api-mapping";
import { resolveAvatar } from "../../_lib/avatars";
import { plural } from "../../_lib/format";
import { canDeleteBuild } from "../../_lib/ownership";
import type { ApiUserProfile } from "../../_lib/api-types";
import type { Build, FeedSort, HeroOption } from "../../_lib/types";

function buildsLabel(count: number): string {
  return `${count} ${plural(count, "build", "builds")}`;
}

type AuthorProfileViewProps = {
  profile: ApiUserProfile;
  initialBuilds: Build[];
  total: number;
  heroes: HeroOption[];
};

export function AuthorProfileView({ profile, initialBuilds, total, heroes }: AuthorProfileViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [builds, setBuilds] = useState(initialBuilds);
  const [buildCount, setBuildCount] = useState(total);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<FeedSort>("new");

  const load = (nextPage: number, nextSort: FeedSort) => {
    fetchBuilds({ page: nextPage, pageSize, author: profile.id, sort: nextSort })
      .then((response) => setBuilds(mapFeed(response.items, heroes)))
      .catch(() => {
      });
  };

  const goToPage = (next: number) => {
    setPage(next);
    load(next, sort);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeBuild = async (id: string) => {
    await deleteBuild(id);
    setBuilds((current) => current.filter((build) => build.id !== id));
    setBuildCount((current) => Math.max(current - 1, 0));
  };

  const changeSort = (next: FeedSort) => {
    if (next === sort) return;
    setSort(next);
    setPage(1);
    load(1, next);
  };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="all-builds-main">
        <section className="author-header">
          <Image className="author-avatar" src={resolveAvatar(profile.picture, profile.displayName)} alt="" width={96} height={96} unoptimized />
          <div>
            <h1 className="author-name">{profile.displayName}</h1>
            <p className="author-meta">
              {buildsLabel(buildCount)}
              {profile.role === "ADMIN" && <span className="author-badge">Admin</span>}
            </p>
          </div>
        </section>
        <section className="feed-controls" aria-label="Sort order for this author">
          <div className="feed-tabs" role="group" aria-label="Sort order">
            <button className={sort === "new" ? "active" : ""} type="button" aria-pressed={sort === "new"} onClick={() => changeSort("new")}>Newest</button>
            <button className={sort === "popular" ? "active" : ""} type="button" aria-pressed={sort === "popular"} onClick={() => changeSort("popular")}>Popular</button>
          </div>
        </section>
        <section className="build-list" aria-label={`Builds by ${profile.displayName}`}>
          {builds.map((build, index) => (
            <BuildCard
              build={build}
              index={index}
              key={build.id}
              onOpen={() => router.push(`/app?build=${build.id}`)}
              canDelete={canDeleteBuild(build, user)}
              onDelete={() => removeBuild(build.id)}
            />
          ))}
        </section>
        {builds.length === 0 && <p className="empty-builds">This author has not published a build yet.</p>}
        <Pagination page={page} pageCount={Math.max(Math.ceil(buildCount / pageSize), 1)} onChange={goToPage} />
      </main>
    </div>
  );
}
