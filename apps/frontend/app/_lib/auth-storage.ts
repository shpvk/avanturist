const refreshStorageKey = "buildverdict.refresh";

let accessToken: string | null = null;
let accessExpiresAt = 0;

export function setAccessToken(token: string | null, expiresIn = 0): void {
  accessToken = token;
  accessExpiresAt = token ? Date.now() + expiresIn * 1000 : 0;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function isAccessTokenFresh(): boolean {
  return Boolean(accessToken) && Date.now() < accessExpiresAt - 30_000;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(refreshStorageKey);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(refreshStorageKey, token);
    else window.localStorage.removeItem(refreshStorageKey);
  } catch {
  }
}

export function clearSession(): void {
  setAccessToken(null);
  setRefreshToken(null);
}
