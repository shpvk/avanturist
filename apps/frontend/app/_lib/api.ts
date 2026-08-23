import type {
  ApiBuild,
  ApiComment,
  ApiHero,
  CreateBuildPayload,
  CreateCommentPayload,
  CreateVotePayload,
} from "./api-types";

/**
 * Base URL of the Nest API (`apps/backend`, global prefix `/api`). Override with
 * VITE_API_URL; the default matches BACKEND_PORT from the repository .env.
 */
const configuredApiUrl = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_URL;

export const apiBaseUrl: string = configuredApiUrl ?? "http://localhost:3001/api";

/** The page must render even when the API is asleep, so server reads give up quickly. */
const serverTimeoutMs = 2500;
const mutationTimeoutMs = 8000;

/** A response the API actually rejected — as opposed to it being unreachable. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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

export function createBuild(payload: CreateBuildPayload): Promise<ApiBuild> {
  return request<ApiBuild>("/builds", { method: "POST", body: JSON.stringify(payload) });
}

/** The API answers a vote with the whole build, tallies included. */
export function createVote(buildId: string, payload: CreateVotePayload): Promise<ApiBuild> {
  return request<ApiBuild>(`/builds/${buildId}/votes`, { method: "POST", body: JSON.stringify(payload) });
}

export function createComment(buildId: string, payload: CreateCommentPayload): Promise<ApiComment> {
  return request<ApiComment>(`/builds/${buildId}/comments`, { method: "POST", body: JSON.stringify(payload) });
}
