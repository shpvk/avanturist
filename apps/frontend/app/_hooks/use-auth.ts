"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  ensureAuthInitialised,
  getAuthState,
  getServerAuthState,
  loginUser,
  logoutUser,
  registerUser,
  setAuthUser,
  subscribeToAuth,
  type AuthState,
} from "../_lib/auth-store";

export type UseAuthResult = AuthState & {
  login: typeof loginUser;
  register: typeof registerUser;
  logout: typeof logoutUser;
  setUser: typeof setAuthUser;
};

export function useAuth(): UseAuthResult {
  const state = useSyncExternalStore(subscribeToAuth, getAuthState, getServerAuthState);

  useEffect(() => {
    ensureAuthInitialised();
  }, []);

  return {
    ...state,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    setUser: setAuthUser,
  };
}
