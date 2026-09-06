import { createId } from "./id";

const voterStorageKey = "buildverdict-voter";

export function getVoterKey(): string {
  try {
    const stored = window.localStorage.getItem(voterStorageKey);
    if (stored) return stored;

    const created = createId("voter");
    window.localStorage.setItem(voterStorageKey, created);
    return created;
  } catch {
    return createId("voter");
  }
}
