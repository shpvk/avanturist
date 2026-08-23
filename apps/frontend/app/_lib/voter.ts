import { createId } from "./id";

const voterStorageKey = "buildverdict-voter";

/**
 * The API counts one vote per `voterKey` and replaces a repeat vote from the same key.
 * There is no auth yet, so the key is a random id kept in this browser.
 */
export function getVoterKey(): string {
  try {
    const stored = window.localStorage.getItem(voterStorageKey);
    if (stored) return stored;

    const created = createId("voter");
    window.localStorage.setItem(voterStorageKey, created);
    return created;
  } catch {
    // Storage blocked: a per-session key still lets the vote through.
    return createId("voter");
  }
}
