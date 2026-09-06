import { ApiError, apiBaseUrl } from "./api-base";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  isAccessTokenFresh,
  setAccessToken,
  setRefreshToken,
} from "./auth-storage";
import type {
  AuthProfile,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from "./auth-types";

const authTimeoutMs = 8000;

async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(authTimeoutMs),
  });

  if (!response.ok) throw new ApiError(response.status, await readError(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message[0] : body.message;
    return message ?? `Запрос завершился с кодом ${response.status}`;
  } catch {
    return `Запрос завершился с кодом ${response.status}`;
  }
}

function remember(response: AuthResponse): AuthResponse {
  setAccessToken(response.accessToken, response.expiresIn);
  setRefreshToken(response.refreshToken);
  return response;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return remember(await post<AuthResponse>("/auth/register", payload));
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return remember(await post<AuthResponse>("/auth/login", payload));
}

export async function exchangeOAuthCode(code: string): Promise<AuthResponse> {
  return remember(await post<AuthResponse>("/auth/google/exchange", { code }));
}

export async function verifyEmail(token: string): Promise<AuthProfile> {
  return post<AuthProfile>("/auth/verify-email", { token });
}

export async function resendVerification(email: string, turnstileToken?: string): Promise<void> {
  await post<void>("/auth/resend-verification", { email, turnstileToken });
}

export async function requestPasswordReset(email: string, turnstileToken?: string): Promise<void> {
  await post<void>("/auth/password-reset/request", { email, turnstileToken });
}

export async function confirmPasswordReset(
  token: string,
  password: string,
  passwordRepeat: string,
): Promise<void> {
  await post<void>("/auth/password-reset/confirm", { token, password, passwordRepeat });
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  clearSession();
  if (!refreshToken) return;
  try {
    await post<void>("/auth/logout", { refreshToken });
  } catch {
  }
}

export async function logoutEverywhere(): Promise<void> {
  try {
    await authorizedFetch("/auth/logout-all", { method: "POST" });
  } finally {
    clearSession();
  }
}

let refreshInFlight: Promise<AuthResponse | null> | null = null;

export function refreshSession(): Promise<AuthResponse | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve(null);

  refreshInFlight = post<AuthResponse>("/auth/refresh", { refreshToken })
    .then(remember)
    .catch(() => {
      clearSession();
      return null;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export async function restoreSession(): Promise<AuthResponse | null> {
  return getRefreshToken() ? refreshSession() : null;
}

export async function authorizedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!isAccessTokenFresh() && getRefreshToken()) await refreshSession();

  const send = (): Promise<Response> =>
    fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(getAccessToken() ? { authorization: `Bearer ${getAccessToken()}` } : {}),
        ...init.headers,
      },
      signal: init.signal ?? AbortSignal.timeout(authTimeoutMs),
    });

  const response = await send();
  if (response.status !== 401) return response;

  const refreshed = await refreshSession();
  if (!refreshed) return response;

  return send();
}

export async function fetchProfile(): Promise<AuthProfile | null> {
  const response = await authorizedFetch("/auth/me");
  if (!response.ok) return null;
  return (await response.json()) as AuthProfile;
}

export function googleSignInUrl(): string {
  return `${apiBaseUrl}/auth/google`;
}
