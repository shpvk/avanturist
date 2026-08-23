import { voteBarLabel } from "../_lib/votes";
import type { VoteTally } from "../_lib/types";

/** Stacked like / situational / dislike bar. Percentages are read out as one label. */
export function VoteBar({ votes }: { votes: VoteTally }) {
  return (
    <div className="vote-bar" role="img" aria-label={voteBarLabel(votes)}><i className="positive" style={{ width: `${votes[0]}%` }} /><i className="uncertain" style={{ width: `${votes[1]}%` }} /><i className="negative" style={{ width: `${votes[2]}%` }} /></div>
  );
}

/**
 * The numbers under the bar. `aligned` spreads them along the bar segments, which the
 * random-build panel needs and the compact feed card does not.
 */
export function VoteValues({ votes, aligned = false }: { votes: VoteTally; aligned?: boolean }) {
  return (
    <div className="vote-values" aria-hidden="true">{votes.map((value, index) => <b key={index} style={aligned ? { flexBasis: `${value}%` } : undefined}>{value}%</b>)}</div>
  );
}
