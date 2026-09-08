import { apiBaseUrl } from "./api-base";
import { authorAvatar } from "./api-mapping";

export function avatarUrl(picture: string): string {
  return /^(https?:|data:)/.test(picture) ? picture : `${apiBaseUrl}${picture}`;
}

export function resolveAvatar(picture: string | null | undefined, author: string): string {
  return picture ? avatarUrl(picture) : authorAvatar(author);
}
