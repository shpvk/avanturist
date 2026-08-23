"use client";

import { useCallback, useSyncExternalStore } from "react";
import { defaultTheme, readDocumentTheme, setDocumentTheme, subscribeToTheme } from "../_lib/theme";
import type { Theme } from "../_lib/types";

const serverTheme = () => defaultTheme;

/**
 * Reads the theme from the document instead of duplicating it in React state, so the
 * bootstrap script, another tab and the toggle can never disagree. Hydration starts from
 * {@link defaultTheme} — the value the server rendered — and adopts the real one right after.
 */
export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribeToTheme, readDocumentTheme, serverTheme);

  const toggleTheme = useCallback(() => {
    setDocumentTheme(readDocumentTheme() === "dark" ? "light" : "dark");
  }, []);

  return [theme, toggleTheme];
}
