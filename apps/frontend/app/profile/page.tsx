"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "../_components/auth-shell";
import { useAuth } from "../_hooks/use-auth";
import { formatBuildDate } from "../_lib/api-mapping";

const roleLabels: Record<string, string> = {
  ADMIN: "Администратор",
  REGULAR: "Игрок",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  const handleLogout = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await logout();
    } catch {
    }
    router.replace("/");
  };

  if (!user) {
    return (
      <AuthShell title="Профиль">
        <p className="auth-status" role="status">
          {isLoading ? "Загружаем профиль…" : "Нужен вход в аккаунт."}
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Профиль">
      <div className="profile-identity">
        <span className="account-avatar profile-avatar" aria-hidden="true">{user.displayName.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{user.displayName}</strong>
          <span>{user.email}</span>
        </div>
      </div>
      <dl className="profile-facts">
        <div><dt>Роль</dt><dd>{roleLabels[user.role] ?? user.role}</dd></div>
        <div><dt>Почта подтверждена</dt><dd>{user.isVerified ? "Да" : "Нет"}</dd></div>
        <div><dt>С нами с</dt><dd>{formatBuildDate(new Date(user.createdAt))}</dd></div>
      </dl>
      <div className="profile-actions">
        <button className="auth-submit" type="button" onClick={handleLogout} disabled={isLeaving}>
          {isLeaving ? "Выходим…" : "Выйти"}
        </button>
        <Link className="auth-inline-link" href="/">← К билдам</Link>
      </div>
    </AuthShell>
  );
}
