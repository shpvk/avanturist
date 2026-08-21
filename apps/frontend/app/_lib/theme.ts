import type { Theme } from "./types";

export const themeStorageKey = "buildverdict-theme";

/** The theme the server renders with; the bootstrap script corrects it before paint. */
export const defaultTheme: Theme = "dark";

/** Runs before hydration so a stored light theme never flashes dark. */
export const themeBootstrapScript = `(() => { try { const saved = localStorage.getItem(${JSON.stringify(themeStorageKey)}); const theme = saved === "light" || saved === "dark" ? saved : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); document.documentElement.dataset.theme = theme; } catch {} })();`;

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/**
 * The document element is the single source of truth for the theme: the bootstrap script
 * writes it before React exists, so reading it back keeps the UI and the page in step.
 */
export function readDocumentTheme(): Theme {
  if (typeof document === "undefined") return defaultTheme;
  const theme = document.documentElement.dataset.theme;
  return isTheme(theme) ? theme : defaultTheme;
}

const themeListeners = new Set<() => void>();

export function setDocumentTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Private mode blocks storage; the switch still works for this session.
  }
  themeListeners.forEach((listener) => listener());
}

/** Store subscription for `useSyncExternalStore`; also follows other tabs. */
export function subscribeToTheme(listener: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== themeStorageKey || !isTheme(event.newValue)) return;
    document.documentElement.dataset.theme = event.newValue;
    listener();
  };

  themeListeners.add(listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}
