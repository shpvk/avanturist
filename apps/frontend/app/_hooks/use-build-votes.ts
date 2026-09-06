"use client";

import { useCallback, useState } from "react";
import { createVote } from "../_lib/api";
import { mapBuild } from "../_lib/api-mapping";
import { reputationValue } from "../_lib/format";
import { getVoterKey } from "../_lib/voter";
import type { Build, HeroOption, Vote } from "../_lib/types";

export type BuildVotes = {
  /** Keyed by build id, so a verdict survives shuffling and view switches. */
  votes: Record<string, Vote>;
  /** A vote still in flight is added to the bar locally; the API's tally replaces it. */
  pendingVotes: Record<string, Vote>;
  castVote: (build: Build, verdict: Vote) => void;
};

export function useBuildVotes(
  heroes: HeroOption[],
  replaceBuild: (id: string, update: (build: Build) => Build) => void,
): BuildVotes {
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [pendingVotes, setPendingVotes] = useState<Record<string, Vote>>({});

  const castVote = useCallback((build: Build, verdict: Vote) => {
    const buildId = build.id;

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
  }, [heroes, replaceBuild]);

  return { votes, pendingVotes, castVote };
}
