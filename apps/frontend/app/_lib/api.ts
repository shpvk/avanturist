import type {
  ApiAccount,
  ApiBuild,
  ApiComment,
  ApiHero,
  CreateBuildPayload,
  CreateCommentPayload,
  CreateVotePayload,
  LoginPayload,
  RegisterPayload,
} from "./api-types";

/**
 * Base URL of the Nest API (`apps/backend`, global prefix `/api`). Override with
 * VITE_API_URL; the default matches APPLICATION_PORT from the repository .env.
 */
const configuredApiUrl = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_URL;

export const apiBaseUrl: string = configuredApiUrl ?? "http://localhost:4000/api";

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

  if (!response.ok) throw new ApiError(response.status, await errorMessage(response, path, requestInit.method));
  // 204 on logout, and anything else the API answers without a body.
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * The API explains a rejected request in `message` — a string, or one line per failed
 * validation rule. That wording is what the auth forms show, so keep it.
 */
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

/**
 * Auth rides on a session cookie, so every one of these calls has to carry credentials;
 * the API allows this origin explicitly (ALLOWED_ORIGIN on the backend).
 */
const authInit: RequestInit = { credentials: "include" };

export function login(payload: LoginPayload): Promise<ApiAccount> {
  return request<ApiAccount>("/auth/login", { ...authInit, method: "POST", body: JSON.stringify(payload) });
}

export function register(payload: RegisterPayload): Promise<ApiAccount> {
  return request<ApiAccount>("/auth/register", { ...authInit, method: "POST", body: JSON.stringify(payload) });
}

/** The account behind the session cookie; ApiError 401 means nobody is signed in. */
export function fetchAccount(timeoutMs = serverTimeoutMs): Promise<ApiAccount> {
  return request<ApiAccount>("/auth/me", { ...authInit, timeoutMs });
}

export function logout(): Promise<void> {
  return request<void>("/auth/logout", { ...authInit, method: "POST" });
}
