"use client";

import { useMemo } from "react";
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
  /** A vote still being saved: counted into the bar until the API answers with its own tally. */
  pendingVote: Vote | null;
  /** Обсуждение под билдом целиком: черновик, состояние композера, модерация. */
  thread: BuildThread;
  onVote: (vote: Vote) => void;
  onNext: () => void;
};

export function RandomBuildView({ build, vote, pendingVote, thread, onVote, onNext }: RandomBuildViewProps) {
  const displayedVotes = useMemo(() => votePercentages(build.votes, pendingVote), [build.votes, pendingVote]);
  const slug = heroSlug(build.heroImage);

  // A vote counts immediately and hands the reader the next build — no confirmation step.
  const handleVote = (value: Vote) => {
    onVote(value);
    onNext();
  };

  return (
    <main className="random-main">
      <article className="random-card dota-stage" aria-label="Случайный билд">
        <div className="dota-build-panel">
          <h1 className="dota-build-title">{build.title}</h1>
          <div className="dota-panel-header">
            <div className="dota-hero-identity">
              <h2>{build.hero}</h2>
            </div>
          </div>
          <div className="dota-panel-meta">
            <span className="build-author">Автор: <strong title={`Репутация: ${build.reputation}`}>{build.author}</strong></span>
          </div>
          <div className="dota-inventory"><InventoryPanel items={build.items} /></div>
        </div>

        <div className="hero-showcase">
          <HeroModelViewer key={slug} hero={build.hero} slug={slug} portrait={build.heroImage} />
        </div>

        <aside className="rating-panel">
          <div className="rating-actions" role="group" aria-label="Ваш вердикт">
            {voteOptions.map((option, index) => (
              <button key={option.value} className={`rating-button ${option.value}${vote === option.value ? " selected" : ""}`} type="button" aria-label={`${option.value === "positive" ? "За" : option.value === "negative" ? "Против" : "Ситуативно"} ${displayedVotes[index]}%`} aria-pressed={vote === option.value} onClick={() => handleVote(option.value)}>
                <span className="verdict-dot" aria-hidden="true" /><span>{option.value === "positive" ? "За" : option.value === "negative" ? "Против" : "Ситуативно"}</span><span className="verdict-percentage">{displayedVotes[index]}%</span>
              </button>
            ))}
          </div>
          <button className="next-build-button" type="button" onClick={onNext}>Следующий билд <span aria-hidden="true">→</span></button>
        </aside>
      </article>
      <div className="discussion-section">
        <BuildComments
          buildId={build.id}
          comments={build.comments}
          draft={thread.draft}
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
