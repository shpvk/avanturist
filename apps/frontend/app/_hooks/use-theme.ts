"use client";

import { useCallback, useSyncExternalStore } from "react";
import { defaultTheme, readDocumentTheme, setDocumentTheme, subscribeToTheme } from "../_lib/theme";
import type { Theme } from "../_lib/types";

const serverTheme = () => defaultTheme;

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribeToTheme, readDocumentTheme, serverTheme);

  const toggleTheme = useCallback(() => {
    setDocumentTheme(readDocumentTheme() === "dark" ? "light" : "dark");
  }, []);

  return [theme, toggleTheme];
}
