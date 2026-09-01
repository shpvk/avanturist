import { apiBaseUrl, ApiError } from "./api-base";
import { authorizedFetch } from "./auth-api";
import type {
  ApiBuild,
  ApiComment,
  ApiHero,
  CreateBuildPayload,
  CreateCommentPayload,
  CreateVotePayload,
} from "./api-types";

export { apiBaseUrl, ApiError } from "./api-base";

/** The page must render even when the API is asleep, so server reads give up quickly. */
const serverTimeoutMs = 2500;
const mutationTimeoutMs = 8000;

async function request<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = mutationTimeoutMs, ...requestInit } = init;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestInit,
    headers: { accept: "application/json", ...(requestInit.body ? { "content-type": "application/json" } : {}), ...requestInit.headers },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) throw new ApiError(response.status, `${requestInit.method ?? "GET"} ${path} → ${response.status}`);
  return (await response.json()) as T;
}

export function fetchHeroes(timeoutMs = serverTimeoutMs): Promise<ApiHero[]> {
  return request<ApiHero[]>("/heroes", { timeoutMs });
}

export function fetchBuilds(timeoutMs = serverTimeoutMs): Promise<ApiBuild[]> {
  return request<ApiBuild[]>("/builds", { timeoutMs });
}

/** Публикация билда доступна только вошедшему пользователю с подтверждённой почтой. */
export async function createBuild(payload: CreateBuildPayload): Promise<ApiBuild> {
  const response = await authorizedFetch("/builds", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new ApiError(response.status, `POST /builds → ${response.status}`);
  return (await response.json()) as ApiBuild;
}

/** The API answers a vote with the whole build, tallies included. */
export function createVote(buildId: string, payload: CreateVotePayload): Promise<ApiBuild> {
  return request<ApiBuild>(`/builds/${buildId}/votes`, { method: "POST", body: JSON.stringify(payload) });
}

export function createComment(buildId: string, payload: CreateCommentPayload): Promise<ApiComment> {
  return request<ApiComment>(`/builds/${buildId}/comments`, { method: "POST", body: JSON.stringify(payload) });
}
