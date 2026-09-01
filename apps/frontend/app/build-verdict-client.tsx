"use client";

import { useCallback, useMemo, useState } from "react";
import { AddBuildDialog } from "./_components/add-build-dialog";
import { AllBuildsView, defaultFeedFilters } from "./_components/all-builds-view";
import { RandomBuildView } from "./_components/random-build-view";
import { SiteHeader } from "./_components/site-header";
import { useAuth } from "./_hooks/use-auth";
import { useTheme } from "./_hooks/use-theme";
import { ApiError, createBuild, createComment, createVote } from "./_lib/api";
import { authorAvatar, mapBuild, mapComment } from "./_lib/api-mapping";
import { createLocalBuild } from "./_lib/build-data";
import { reputationValue } from "./_lib/format";
import { createId } from "./_lib/id";
import { getVoterKey } from "./_lib/voter";
import type { CreateBuildPayload } from "./_lib/api-types";
import type { Build, BuildComment, FeedFilters, HeroOption, Vote, View } from "./_lib/types";

/** The API stores an author name of 2..40 characters and nothing else about the writer. */
const anonymousAuthor = "Вы";
const maxAuthorLength = 40;

/** Picks a build other than `currentId`; with a single build there is nothing to pick. */
function pickNextBuildId(builds: Build[], currentId: string): string {
  if (builds.length < 2) return builds[0]?.id ?? currentId;
  const currentIndex = Math.max(builds.findIndex((build) => build.id === currentId), 0);
  const offset = 1 + Math.floor(Math.random() * (builds.length - 1));
  return builds[(currentIndex + offset) % builds.length].id;
}

function scrollToTop() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" }));
}

type BuildVerdictClientProps = {
  /** Feed read on the server (`_lib/feed.ts`) — API builds, or the demo ones if it was down. */
  initialBuilds: Build[];
  heroes: HeroOption[];
};

export default function BuildVerdictClient({ initialBuilds, heroes }: BuildVerdictClientProps) {
  const { user } = useAuth();
  const [builds, setBuilds] = useState<Build[]>(initialBuilds);
  const [view, setView] = useState<View>("random");
  const [currentBuildId, setCurrentBuildId] = useState(initialBuilds[0]?.id ?? "");
  const [isAddBuildOpen, setIsAddBuildOpen] = useState(false);
  const [filters, setFilters] = useState<FeedFilters>(defaultFeedFilters);
  const [theme, toggleTheme] = useTheme();

  // Keyed by build id, so a vote or an unsent draft survives shuffling and view switches.
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  // A vote still in flight is added to the bar locally; the API's own tally replaces it.
  const [pendingVotes, setPendingVotes] = useState<Record<string, Vote>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);

  const authorName = (user?.displayName ?? anonymousAuthor).slice(0, maxAuthorLength);
  const currentBuild = useMemo(
    () => builds.find((build) => build.id === currentBuildId) ?? builds[0],
    [builds, currentBuildId],
  );

  const replaceBuild = useCallback((id: string, update: (build: Build) => Build) => {
    setBuilds((current) => current.map((build) => (build.id === id ? update(build) : build)));
  }, []);

  const showNextBuild = useCallback(() => {
    setCurrentBuildId((current) => pickNextBuildId(builds, current));
  }, [builds]);

  const openBuild = useCallback((id: string) => {
    setCurrentBuildId(id);
    setView("random");
    scrollToTop();
  }, []);

  const castVote = useCallback((verdict: Vote) => {
    if (!currentBuild) return;
    const buildId = currentBuild.id;

    setVotes((current) => ({ ...current, [buildId]: verdict }));
    setPendingVotes((current) => ({ ...current, [buildId]: verdict }));

    createVote(buildId, { verdict, voterKey: getVoterKey() })
      .then((apiBuild) => {
        replaceBuild(buildId, (previous) => mapBuild(apiBuild, { heroes, reputation: reputationValue(previous.reputation) }));
        setPendingVotes((current) => {
          const next = { ...current };
          delete next[buildId];
          return next;
        });
      })
      .catch(() => {
        // The API is unreachable: keep the local tally so the demo still answers.
      });
  }, [currentBuild, heroes, replaceBuild]);

  const setDraft = useCallback((value: string) => {
    if (!currentBuild) return;
    setDrafts((current) => ({ ...current, [currentBuild.id]: value }));
  }, [currentBuild]);

  const addComment = useCallback((text: string) => {
    if (!currentBuild) return;
    const buildId = currentBuild.id;
    const optimistic: BuildComment = {
      id: createId(`${buildId}-comment`),
      author: authorName,
      avatar: authorAvatar(authorName),
      date: "только что",
      text,
    };

    replaceBuild(buildId, (previous) => ({ ...previous, comments: [...previous.comments, optimistic] }));
    setDrafts((current) => ({ ...current, [buildId]: "" }));

    createComment(buildId, { author: authorName, text })
      .then((created) => {
        replaceBuild(buildId, (previous) => ({
          ...previous,
          comments: previous.comments.map((comment) => (comment.id === optimistic.id ? mapComment(created) : comment)),
        }));
      })
      .catch(() => {
        // Same as votes: the comment stays on screen even without a backend.
      });
  }, [authorName, currentBuild, replaceBuild]);

  const addBuild = useCallback(async (payload: CreateBuildPayload) => {
    const hero = heroes.find((option) => option.id === payload.heroId);
    if (!hero) throw new Error(`Unknown hero "${payload.heroId}"`);

    let build: Build;
    try {
      build = mapBuild(await createBuild(payload), { heroes });
    } catch (error) {
      // A rejected build is the author's problem to fix; an unreachable API is not.
      if (error instanceof ApiError) throw error;
      build = createLocalBuild(hero, payload.title, payload.items, new Date());
    }

    setBuilds((current) => [build, ...current]);
    setCurrentBuildId(build.id);
    setView("all");
    setIsAddBuildOpen(false);
  }, [authorName, heroes]);

  return (
    <div className="site-shell">
      <SiteHeader view={view} theme={theme} onViewChange={setView} onThemeToggle={toggleTheme} onAddBuild={() => setIsAddBuildOpen(true)} />
      {view === "random" && currentBuild ? (
        <RandomBuildView
          build={currentBuild}
          vote={votes[currentBuild.id] ?? null}
          pendingVote={pendingVotes[currentBuild.id] ?? null}
          draft={drafts[currentBuild.id] ?? ""}
          commentsExpanded={expandedCommentsId === currentBuild.id}
          onVote={castVote}
          onNext={showNextBuild}
          onDraftChange={setDraft}
          onAddComment={addComment}
          onCommentsExpandedChange={(expanded) => setExpandedCommentsId(expanded ? currentBuild.id : null)}
        />
      ) : (
        <AllBuildsView builds={builds} filters={filters} onFiltersChange={setFilters} onOpenBuild={openBuild} />
      )}
      {isAddBuildOpen && <AddBuildDialog heroes={heroes} onClose={() => setIsAddBuildOpen(false)} onSubmit={addBuild} />}
    </div>
  );
}
