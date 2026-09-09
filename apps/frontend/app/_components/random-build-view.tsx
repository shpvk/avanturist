"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { BuildComments } from "./build-comments";
import { InventoryPanel } from "./inventory-panel";
import HeroModelViewer from "../_hero-model/hero-model-viewer";
import { heroSlug, voteOptions } from "../_lib/build-data";
import { votePercentages } from "../_lib/votes";
import type { BuildThread } from "../_hooks/use-build-thread";
import type { Build, Vote } from "../_lib/types";

type RandomBuildViewProps = {
  build: Build;
  vote: Vote | null;
  pendingVote: Vote | null;
  thread: BuildThread;
  onVote: (vote: Vote) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoBack: boolean;
};

function AuthorLink({ build, className, children }: { build: Build; className?: string; children: React.ReactNode }) {
  if (!build.authorId) return <>{children}</>;

  return (
    <Link className={className} href={`/users/${build.authorId}`} title={`Author profile: ${build.author}`}>
      {children}
    </Link>
  );
}

export function RandomBuildView({ build, vote, pendingVote, thread, onVote, onNext, onPrevious, canGoBack }: RandomBuildViewProps) {
  const displayedVotes = useMemo(() => votePercentages(build.votes, pendingVote), [build.votes, pendingVote]);
  const slug = heroSlug(build.heroImage);

  const handleVote = (value: Vote) => {
    onVote(value);
    onNext();
  };

  return (
    <main className="random-main">
      <article className="random-card dota-stage" aria-label="Random build">
        <div className="dota-build-panel">
          <div className="dota-panel-header">
            <AuthorLink build={build} className="dota-player-avatar-link">
              <Image className="dota-player-avatar" src={build.avatar} alt="" width={72} height={72} loading="lazy" unoptimized />
            </AuthorLink>
            <div className="dota-panel-meta">
              <p className="dota-player-name">
                <span className="sr-only">Author: </span>
                <strong><AuthorLink build={build}>{build.author}</AuthorLink></strong>
              </p>
              <div className="dota-hero-identity">
                <h2>{build.hero}</h2>
              </div>
            </div>
          </div>
          <h1 className="dota-build-title">{build.title}</h1>
          <div className="dota-inventory"><InventoryPanel items={build.items} /></div>
        </div>

        <div className="hero-showcase">
          <HeroModelViewer key={slug} hero={build.hero} slug={slug} portrait={build.heroImage} />
        </div>

        <aside className="rating-panel">
          <div className="rating-actions" role="group" aria-label="Your verdict">
            {voteOptions.map((option, index) => (
              <button key={option.value} className={`rating-button ${option.value}${vote === option.value ? " selected" : ""}`} type="button" aria-label={`${option.label} ${displayedVotes[index]}%`} aria-pressed={vote === option.value} onClick={() => handleVote(option.value)}>
                <span className="verdict-dot" aria-hidden="true" /><span>{option.label}</span><span className="verdict-percentage">{displayedVotes[index]}%</span>
              </button>
            ))}
          </div>
          <div className="rating-nav">
            <button className="prev-build-button" type="button" onClick={onPrevious} disabled={!canGoBack}><span aria-hidden="true">←</span> Previous build</button>
            <button className="next-build-button" type="button" onClick={onNext}>Next build <span aria-hidden="true">→</span></button>
          </div>
        </aside>
      </article>
      <div className="discussion-section">
        <BuildComments
          buildId={build.id}
          comments={build.comments}
          count={build.commentCount}
          draft={thread.draft}
          viewerAvatar={thread.viewerAvatar}
          composer={thread.composer}
          moderation={thread.moderation}
          error={thread.error}
          onDraftChange={thread.setDraft}
          onSubmit={thread.addComment}
        />
      </div>
    </main>
  );
}
