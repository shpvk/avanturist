import type { AuthProfile } from "./auth-types";
import type { Build } from "./types";

export function canDeleteBuild(build: Build, user: AuthProfile | null): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return !!build.authorId && build.authorId === user.id;
}
