"use client";

import { useCallback, useState } from "react";
import { AddBuildDialog } from "./_components/add-build-dialog";
import { AllBuildsView, defaultFeedFilters } from "./_components/all-builds-view";
import { MuteDialog } from "./_components/mute-dialog";
import { RandomBuildView } from "./_components/random-build-view";
import { SiteHeader } from "./_components/site-header";
import { useBuildFeed } from "./_hooks/use-build-feed";
import { useBuildThread } from "./_hooks/use-build-thread";
import { useBuildVotes } from "./_hooks/use-build-votes";
import { useTheme } from "./_hooks/use-theme";
import type { CreateBuildPayload } from "./_lib/api-types";
import type { Build, FeedFilters, HeroOption, Vote, View } from "./_lib/types";

function scrollToTop() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" }));
}

type BuildVerdictClientProps = {
  /** Feed read on the server (`_lib/feed.ts`) — API builds, or the demo ones if it was down. */
  initialBuilds: Build[];
  heroes: HeroOption[];
};

/**
 * Сборка страницы из трёх состояний: лента, голоса и обсуждение. Сам компонент
 * держит только то, что относится к странице — вкладку, фильтры и диалоги.
 */
export default function BuildVerdictClient({ initialBuilds, heroes }: BuildVerdictClientProps) {
  const { builds, currentBuild, replaceBuild, updateComments, showNextBuild, selectBuild, addBuild } = useBuildFeed(initialBuilds, heroes);
  const { votes, pendingVotes, castVote } = useBuildVotes(heroes, replaceBuild);
  const thread = useBuildThread({ currentBuild, replaceBuild, updateComments });

  const [view, setView] = useState<View>("random");
  const [isAddBuildOpen, setIsAddBuildOpen] = useState(false);
  const [filters, setFilters] = useState<FeedFilters>(defaultFeedFilters);
  const [theme, toggleTheme] = useTheme();

  const openBuild = useCallback((id: string) => {
    selectBuild(id);
    setView("random");
    scrollToTop();
  }, [selectBuild]);

  const handleVote = useCallback((verdict: Vote) => {
    if (!currentBuild) return;
    castVote(currentBuild, verdict);
  }, [castVote, currentBuild]);

  const handleAddBuild = useCallback(async (payload: CreateBuildPayload) => {
    await addBuild(payload);
    setView("all");
    setIsAddBuildOpen(false);
  }, [addBuild]);

  return (
    <div className="site-shell">
      <SiteHeader view={view} theme={theme} onViewChange={setView} onThemeToggle={toggleTheme} onAddBuild={() => setIsAddBuildOpen(true)} />
      {view === "random" && currentBuild ? (
        <RandomBuildView
          build={currentBuild}
          vote={votes[currentBuild.id] ?? null}
          pendingVote={pendingVotes[currentBuild.id] ?? null}
          thread={thread}
          onVote={handleVote}
          onNext={showNextBuild}
        />
      ) : (
        <AllBuildsView builds={builds} heroes={heroes} filters={filters} onFiltersChange={setFilters} onOpenBuild={openBuild} />
      )}
      {isAddBuildOpen && <AddBuildDialog heroes={heroes} onClose={() => setIsAddBuildOpen(false)} onSubmit={handleAddBuild} />}
      {thread.muteTarget && (
        <MuteDialog author={thread.muteTarget.author} onClose={thread.closeMuteDialog} onSubmit={thread.submitMute} />
      )}
    </div>
  );
}
