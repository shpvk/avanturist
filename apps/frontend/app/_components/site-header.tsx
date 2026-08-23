import { chatGPTSignInPath, chatGPTSignOutPath } from "../_lib/auth-paths";
import type { AuthUser, Theme, View } from "../_lib/types";

type SiteHeaderProps = {
  view: View;
  theme: Theme;
  user: AuthUser | null;
  onViewChange: (view: View) => void;
  onThemeToggle: () => void;
  onAddBuild: () => void;
};

export function SiteHeader({ view, theme, user, onViewChange, onThemeToggle, onAddBuild }: SiteHeaderProps) {
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
            <a className="account-button" href={chatGPTSignOutPath("/")} aria-label={`Выйти из аккаунта ${user.name}`}>
              <span className="account-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="account-copy"><strong>{user.name}</strong><small>Выйти</small></span>
            </a>
          ) : (
            <a className="login-button" href={chatGPTSignInPath("/")}><span className="person-icon" aria-hidden="true" />Войти</a>
          )}
        </div>
      </div>
    </header>
  );
}
