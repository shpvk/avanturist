import { login as loginRequest, logout as logoutRequest, register as registerRequest, restoreSession } from "./auth-api";
import type { AuthProfile, LoginPayload, RegisterPayload } from "./auth-types";

export type AuthState = {
  user: AuthProfile | null;
  /** true, пока идёт первое восстановление сессии из refresh-токена. */
  isLoading: boolean;
};

/**
 * Сессия живёт во внешнем сторе, а не в React-контексте: страницы рендерятся
 * как RSC, и провайдер из layout до их клиентских поддеревьев не дотягивается.
 */
const serverState: AuthState = { user: null, isLoading: true };

let state: AuthState = serverState;
const listeners = new Set<() => void>();
let initialised = false;

function emit(next: AuthState): void {
  state = next;
  for (const listener of listeners) listener();
}

export function subscribeToAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAuthState(): AuthState {
  return state;
}

export function getServerAuthState(): AuthState {
  return serverState;
}

export function setAuthUser(user: AuthProfile | null): void {
  emit({ user, isLoading: false });
}

/** Первое обращение поднимает сессию ротацией refresh-токена из localStorage. */
export function ensureAuthInitialised(): void {
  if (initialised || typeof window === "undefined") return;
  initialised = true;

  restoreSession()
    .then((session) => emit({ user: session?.user ?? null, isLoading: false }))
    .catch(() => emit({ user: null, isLoading: false }));
}

export async function loginUser(payload: LoginPayload): Promise<AuthProfile> {
  const session = await loginRequest(payload);
  setAuthUser(session.user);
  return session.user;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthProfile> {
  const session = await registerRequest(payload);
  setAuthUser(session.user);
  return session.user;
}

export async function logoutUser(): Promise<void> {
  await logoutRequest();
  setAuthUser(null);
}
