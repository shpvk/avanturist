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
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <nav className="header-nav" aria-label="Основные разделы">
          <button className={view === "random" ? "active" : ""} type="button" aria-pressed={view === "random"} onClick={() => onViewChange("random")}>Случайный билд</button>
          <button className={view === "all" ? "active" : ""} type="button" aria-pressed={view === "all"} onClick={() => onViewChange("all")}>Все билды</button>
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
          <button className="primary-button" type="button" onClick={onAddBuild}>Добавить билд</button>
          {user ? (
            <button
              className="account-button"
              type="button"
              onClick={() => void logout()}
              aria-label={`Выйти из аккаунта ${user.displayName}`}
            >
              <span className="account-avatar" aria-hidden="true">{user.displayName.slice(0, 1).toUpperCase()}</span>
              <span className="account-copy"><strong>{user.displayName}</strong><small>Выйти</small></span>
            </button>
          ) : (
            <Link className="login-button" href="/login">
              <span className="person-icon" aria-hidden="true" />Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
