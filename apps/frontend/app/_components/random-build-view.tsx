"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Author } from "./author";
import { BuildComments } from "./build-comments";
import { ItemIcons } from "./item-icons";
import { VoteBar, VoteValues } from "./vote-bar";
import HeroModelViewer from "../_hero-model/hero-model-viewer";
import { heroSlug, voteOptions } from "../_lib/build-data";
import { votePercentages } from "../_lib/votes";
import type { Build, Vote } from "../_lib/types";

type RandomBuildViewProps = {
  build: Build;
  vote: Vote | null;
  /** A vote still being saved: counted into the bar until the API answers with its own tally. */
  pendingVote: Vote | null;
  draft: string;
  commentsExpanded: boolean;
  onVote: (vote: Vote) => void;
  onNext: () => void;
  onDraftChange: (value: string) => void;
  onAddComment: (text: string) => void;
  onCommentsExpandedChange: (expanded: boolean) => void;
};

export function RandomBuildView({
  build,
  vote,
  pendingVote,
  draft,
  commentsExpanded,
  onVote,
  onNext,
  onDraftChange,
  onAddComment,
  onCommentsExpandedChange,
}: RandomBuildViewProps) {
  const displayedVotes = useMemo(() => votePercentages(build.votes, pendingVote), [build.votes, pendingVote]);
  const slug = heroSlug(build.heroImage);

  // A vote counts immediately and hands the reader the next build — no confirmation step.
  const handleVote = (value: Vote) => {
    onVote(value);
    onNext();
  };

  return (
    <main className="random-main">
      <h1 className="sr-only">Случайный билд: {build.hero} — {build.title}</h1>

      <article className="random-card dota-stage">
        <div className="dota-build-panel">
          <div className="dota-panel-header">
            <div className="dota-hero-identity">
              <Image src={build.heroImage} alt="" width={256} height={144} unoptimized />
              <div><span className={`role-badge ${build.roleClass}`}>{build.role}</span><h2>{build.hero}</h2></div>
            </div>
            <div className="dota-panel-meta">
              <div className="dota-panel-author">
                <Author build={build} />
                <time className="random-build-date" dateTime={build.dateTime}>{build.date}</time>
              </div>
              <button className="shuffle-button" type="button" onClick={onNext}><span aria-hidden="true">↻</span> Другой билд</button>
            </div>
          </div>
          <h3 className="dota-build-title">{build.title}</h3>
          <div className="dota-inventory"><span className="section-label">Предметы</span><ItemIcons items={build.items} inventory /></div>
          <BuildComments
            buildId={build.id}
            comments={build.comments}
            expanded={commentsExpanded}
            draft={draft}
            onToggleExpanded={() => onCommentsExpandedChange(!commentsExpanded)}
            onExpand={() => onCommentsExpandedChange(true)}
            onDraftChange={onDraftChange}
            onSubmit={onAddComment}
          />
        </div>

        <div className="hero-showcase">
          <div className="hero-aura" aria-hidden="true" />
          <HeroModelViewer key={slug} hero={build.hero} slug={slug} portrait={build.heroImage} />
        </div>

        <aside className="rating-panel">
          <div className="rating-actions">
            {voteOptions.map((option) => (
              <button key={option.value} className={`rating-button ${option.value}${vote === option.value ? " selected" : ""}`} type="button" aria-pressed={vote === option.value} onClick={() => handleVote(option.value)}>
                <span className="rating-icon" aria-hidden="true">{option.icon}</span><span><strong>{option.label}</strong><small>{option.hint}</small></span>
              </button>
            ))}
          </div>
          <div className="random-results" aria-live="polite">
            <div><span>Мнение сообщества</span><strong>{displayedVotes[0] + displayedVotes[1]}% считают билд полезным</strong></div>
            <VoteBar votes={displayedVotes} />
            <VoteValues votes={displayedVotes} aligned />
          </div>
          <button className="next-build-button" type="button" onClick={onNext}>Следующий билд <span aria-hidden="true">→</span></button>
        </aside>
      </article>
    </main>
  );
}
