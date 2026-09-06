import { apiBaseUrl, ApiError } from "./api-base";
import { authorizedFetch } from "./auth-api";
import type {
  ApiBuild,
  ApiComment,
  ApiFeedPage,
  ApiHero,
  ApiMute,
  CreateBuildPayload,
  CreateCommentPayload,
  CreateVotePayload,
  FeedQuery,
  MutePayload,
} from "./api-types";

export { apiBaseUrl, ApiError } from "./api-base";

const serverTimeoutMs = 2500;
const mutationTimeoutMs = 8000;

async function request<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = mutationTimeoutMs, ...requestInit } = init;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestInit,
    headers: { accept: "application/json", ...(requestInit.body ? { "content-type": "application/json" } : {}), ...requestInit.headers },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) throw new ApiError(response.status, await errorMessage(response, path, requestInit.method));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function errorMessage(response: Response, path: string, method = "GET"): Promise<string> {
  const fallback = `${method} ${path} → ${response.status}`;
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;

  if (typeof body?.message === "string" && body.message) return body.message;
  if (Array.isArray(body?.message) && body.message.length > 0) return body.message.join(". ");
  return fallback;
}

export function fetchHeroes(timeoutMs = serverTimeoutMs): Promise<ApiHero[]> {
  return request<ApiHero[]>("/heroes", { timeoutMs });
}

export function fetchBuilds(query: FeedQuery = {}, timeoutMs = serverTimeoutMs): Promise<ApiFeedPage> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "" && value !== "all") search.set(key, String(value));
  }
  const suffix = search.size > 0 ? `?${search}` : "";

  return request<ApiFeedPage>(`/builds${suffix}`, { timeoutMs });
}

export function fetchRandomBuild(timeoutMs = serverTimeoutMs): Promise<ApiBuild> {
  return request<ApiBuild>("/builds/random", { timeoutMs });
}

export async function createBuild(payload: CreateBuildPayload): Promise<ApiBuild> {
  const response = await authorizedFetch("/builds", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new ApiError(response.status, `POST /builds → ${response.status}`);
  return (await response.json()) as ApiBuild;
}

export async function deleteBuild(buildId: string): Promise<void> {
  const response = await authorizedFetch(`/builds/${buildId}`, { method: "DELETE" });

  if (!response.ok) throw new ApiError(response.status, `DELETE /builds/${buildId} → ${response.status}`);
}

export function createVote(buildId: string, payload: CreateVotePayload): Promise<ApiBuild> {
  return request<ApiBuild>(`/builds/${buildId}/votes`, { method: "POST", body: JSON.stringify(payload) });
}

export class CommentRejectedError extends ApiError {
  readonly mute: { until: string | null; reason: string | null } | null;

  constructor(status: number, message: string, mute: { until: string | null; reason: string | null } | null) {
    super(status, message);
    this.name = "CommentRejectedError";
    this.mute = mute;
  }
}

type CommentErrorBody = { message?: string | string[]; mutedUntil?: string | null; muteReason?: string | null };

async function commentRejection(response: Response): Promise<CommentRejectedError> {
  let body: CommentErrorBody = {};
  try {
    body = (await response.json()) as CommentErrorBody;
  } catch {
  }

  const message = Array.isArray(body.message) ? body.message[0] : body.message;
  const muted = "mutedUntil" in body;

  return new CommentRejectedError(
    response.status,
    message ?? `POST comment → ${response.status}`,
    muted ? { until: body.mutedUntil ?? null, reason: body.muteReason ?? null } : null,
  );
}

export async function fetchComments(buildId: string): Promise<ApiComment[]> {
  const response = await authorizedFetch(`/builds/${buildId}/comments`);

  if (!response.ok) throw new ApiError(response.status, `GET /builds/${buildId}/comments → ${response.status}`);
  return (await response.json()) as ApiComment[];
}

export async function createComment(buildId: string, payload: CreateCommentPayload): Promise<ApiComment> {
  const response = await authorizedFetch(`/builds/${buildId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw await commentRejection(response);
  return (await response.json()) as ApiComment;
}

export async function hideComment(commentId: string): Promise<ApiComment> {
  return moderate(`/comments/${commentId}`, "DELETE");
}

export async function restoreComment(commentId: string): Promise<ApiComment> {
  return moderate(`/comments/${commentId}/restore`, "POST");
}

async function moderate(path: string, method: "POST" | "DELETE"): Promise<ApiComment> {
  const response = await authorizedFetch(path, { method });

  if (!response.ok) throw new ApiError(response.status, `${method} ${path} → ${response.status}`);
  return (await response.json()) as ApiComment;
}

export async function muteUser(userId: string, payload: MutePayload): Promise<ApiMute> {
  const response = await authorizedFetch(`/users/${userId}/mute`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new ApiError(response.status, `POST /users/${userId}/mute → ${response.status}`);
  return (await response.json()) as ApiMute;
}

export async function unmuteUser(userId: string): Promise<ApiMute> {
  const response = await authorizedFetch(`/users/${userId}/mute`, { method: "DELETE" });

  if (!response.ok) throw new ApiError(response.status, `DELETE /users/${userId}/mute → ${response.status}`);
  return (await response.json()) as ApiMute;
}
