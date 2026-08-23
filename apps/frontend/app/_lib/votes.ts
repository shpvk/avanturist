import type { Vote, VoteTally } from "./types";

const voteIndex: Record<Vote, 0 | 1 | 2> = { positive: 0, situational: 1, negative: 2 };

/**
 * Stored tallies are already percentages. Adding the reader's own vote re-normalises
 * them so the bar keeps summing to 100 instead of overflowing past the track.
 */
export function votePercentages(votes: VoteTally, vote: Vote | null): VoteTally {
  if (!vote) return votes;

  const values: VoteTally = [...votes];
  values[voteIndex[vote]] += 1;
  const total = values[0] + values[1] + values[2];
  if (total === 0) return values;

  return values.map((value) => Math.round((value / total) * 100)) as VoteTally;
}

export function voteBarLabel(votes: VoteTally): string {
  return `Лайк ${votes[0]}%, ситуативно ${votes[1]}%, дизлайк ${votes[2]}%`;
}
