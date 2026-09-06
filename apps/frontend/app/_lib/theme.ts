import type { Theme } from "./types";

export const themeStorageKey = "buildverdict-theme";

export const defaultTheme: Theme = "dark";

export const themeBootstrapScript = `(() => { try { const saved = localStorage.getItem(${JSON.stringify(themeStorageKey)}); const theme = saved === "light" || saved === "dark" ? saved : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); document.documentElement.dataset.theme = theme; } catch {} })();`;

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

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
  }
  themeListeners.forEach((listener) => listener());
}

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
