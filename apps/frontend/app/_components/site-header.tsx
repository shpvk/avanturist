"use client";

import Link from "next/link";
import { useAuth } from "../_hooks/use-auth";
import type { Theme, View } from "../_lib/types";

type SiteHeaderProps = {
  view: View;
  theme: Theme;
  onViewChange: (view: View) => void;
  onThemeToggle: () => void;
  onAddBuild: () => void;
};

export function SiteHeader({ view, theme, onViewChange, onThemeToggle, onAddBuild }: SiteHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="wordmark" type="button" onClick={() => onViewChange("random")} aria-label="BuildVerdict — главная">build<span>verdict</span></button>
        <nav className="header-nav" aria-label="Основные разделы">
          <button className={view === "all" ? "active" : ""} type="button" aria-label="Все билды" aria-pressed={view === "all"} onClick={() => onViewChange("all")}>Билды</button>
          <button type="button" onClick={onAddBuild}>Добавить билд</button>
        </nav>
        <button
          className={`theme-toggle ${theme}`}
          type="button"
          onClick={onThemeToggle}
          aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
          title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          suppressHydrationWarning
        >
          <span className="theme-icon" aria-hidden="true" />
        </button>
        <div className="header-actions">
          {/* Signed in or not, the icon goes to /profile — the profile page sends guests on to /login. */}
          <Link className="profile-button" href="/profile" aria-label={user ? `Профиль: ${user.displayName}` : "Профиль"} title={user ? user.displayName : "Профиль"}>
            {user
              ? <span className="account-avatar" aria-hidden="true">{user.displayName.slice(0, 1).toUpperCase()}</span>
              : <span className="person-icon" aria-hidden="true" />}
          </Link>
        </div>
      </div>
    </header>
  );
}
