"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, fetchAccount, logout } from "../_lib/api";
import { formatBuildDate } from "../_lib/api-mapping";
import type { ApiAccount } from "../_lib/api-types";

const loginPath = "/login?return_to=%2Fprofile";

const roleLabels: Record<string, string> = {
  ADMIN: "Администратор",
  REGULAR: "Игрок",
};

export default function ProfilePage() {
  const [account, setAccount] = useState<ApiAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // The session lives in a cookie for the API's origin, so only the browser can ask who
  // it belongs to: no reader is signed in as far as the server render is concerned.
  useEffect(() => {
    let cancelled = false;

    fetchAccount().then(
      (loaded) => { if (!cancelled) setAccount(loaded); },
      (cause) => {
        if (cancelled) return;
        if (cause instanceof ApiError && cause.status === 401) {
          window.location.replace(loginPath);
          return;
        }
        setError("Не удалось загрузить профиль — сервер недоступен.");
      },
    );

    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await logout();
    } catch {
      // The session may already be gone; either way the reader wanted out.
    }
    window.location.assign("/");
  };

  return (
    <div className="site-shell auth-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="wordmark" href="/" aria-label="BuildVerdict — главная">build<span>verdict</span></Link>
        </div>
      </header>
      <main className="auth-main">
        <section className="auth-card profile-card" aria-labelledby="profile-title">
          <span className="eyebrow">Аккаунт</span>
          <h1 id="profile-title">Профиль</h1>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {!account && !error && <p className="auth-lead" role="status">Загружаем профиль…</p>}
          {account && (
            <>
              <div className="profile-identity">
                <span className="account-avatar profile-avatar" aria-hidden="true">{account.displayName.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{account.displayName}</strong>
                  <span>{account.email}</span>
                </div>
              </div>
              <dl className="profile-facts">
                <div><dt>Роль</dt><dd>{roleLabels[account.role] ?? account.role}</dd></div>
                <div><dt>С нами с</dt><dd>{formatBuildDate(new Date(account.createdAt))}</dd></div>
              </dl>
              <div className="profile-actions">
                <Link className="auth-back" href="/">← К билдам</Link>
                <button className="cancel-button" type="button" onClick={handleLogout} disabled={isLeaving}>Выйти</button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
