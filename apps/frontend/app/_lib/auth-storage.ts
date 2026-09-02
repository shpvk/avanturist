/**
 * Refresh-токен живёт в localStorage, access — только в памяти вкладки.
 * Cookie в проекте не используются, поэтому HttpOnly здесь недоступен: цену
 * XSS снижает CSP из `worker/index.ts` — она обрезает каналы, по которым
 * украденный токен уходил бы наружу. Полной замены HttpOnly это не даёт.
 */
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

/** Токен считается протухшим за 30 секунд до срока: запас на дорогу до сервера. */
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
    // Приватный режим или запрет на хранилище: сессия проживёт до перезагрузки.
  }
}

export function clearSession(): void {
  setAccessToken(null);
  setRefreshToken(null);
}
