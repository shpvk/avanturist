"use client";

import { useCallback, useState } from "react";
import { AddBuildDialog } from "./_components/add-build-dialog";
import { AllBuildsView } from "./_components/all-builds-view";
import { MuteDialog } from "./_components/mute-dialog";
import { RandomBuildView } from "./_components/random-build-view";
import { SiteHeader } from "./_components/site-header";
import { useAuth } from "./_hooks/use-auth";
import { useBuildFeed } from "./_hooks/use-build-feed";
import { useBuildThread } from "./_hooks/use-build-thread";
import { useBuildVotes } from "./_hooks/use-build-votes";
import { useTheme } from "./_hooks/use-theme";
import type { CreateBuildPayload } from "./_lib/api-types";
import { canDeleteBuild } from "./_lib/ownership";
import type { Build, HeroOption, Vote, View } from "./_lib/types";

function scrollToTop() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" }));
}

type BuildVerdictClientProps = {
  initialBuilds: Build[];
  initialTotal: number;
  heroes: HeroOption[];
};

export default function BuildVerdictClient({ initialBuilds, initialTotal, heroes }: BuildVerdictClientProps) {
  const feed = useBuildFeed({ initialBuilds, initialTotal, heroes });
  const { builds, currentBuild, replaceBuild, updateComments, showNextBuild, showPreviousBuild, selectBuild, addBuild, removeBuild } = feed;
  const { user } = useAuth();
  const { votes, pendingVotes, castVote } = useBuildVotes(heroes, replaceBuild);
  const thread = useBuildThread({ currentBuild, replaceBuild, updateComments });

  const [view, setView] = useState<View>("random");
  const [isAddBuildOpen, setIsAddBuildOpen] = useState(false);
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

  const handleDeleteBuild = useCallback(async (id: string) => {
    await removeBuild(id);
  }, [removeBuild]);

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
          onPrevious={showPreviousBuild}
          canGoBack={feed.canGoBack}
          canDelete={canDeleteBuild(currentBuild, user)}
          onDelete={() => handleDeleteBuild(currentBuild.id)}
        />
      ) : (
        <AllBuildsView
          builds={builds}
          total={feed.total}
          page={feed.page}
          pageSize={feed.pageSize}
          isLoading={feed.isLoading}
          heroes={heroes}
          filters={feed.filters}
          onFiltersChange={feed.updateFilters}
          onPageChange={feed.goToPage}
          onOpenBuild={openBuild}
          onDeleteBuild={handleDeleteBuild}
        />
      )}
      {isAddBuildOpen && user && <AddBuildDialog heroes={heroes} onClose={() => setIsAddBuildOpen(false)} onSubmit={handleAddBuild} />}
      {thread.muteTarget && (
        <MuteDialog author={thread.muteTarget.author} onClose={thread.closeMuteDialog} onSubmit={thread.submitMute} />
      )}
    </div>
  );
}
