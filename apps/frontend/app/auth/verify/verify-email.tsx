"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "../../_components/auth-shell";
import { useAuth } from "../../_hooks/use-auth";
import { verifyEmail } from "../../_lib/auth-api";

type Status = "pending" | "done" | "failed";

export function VerifyEmail() {
  const params = useSearchParams();
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState<Status>("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      setStatus("failed");
      setError("Ссылка не содержит токен подтверждения.");
      return;
    }

    let cancelled = false;

    verifyEmail(token)
      .then((profile) => {
        if (cancelled) return;
        // Профиль в шапке обновляем только если это та же вкладка и тот же аккаунт.
        if (user?.id === profile.id) setUser(profile);
        setStatus("done");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setStatus("failed");
        setError(cause instanceof Error ? cause.message : "Не удалось подтвердить почту.");
      });

    return () => {
      cancelled = true;
    };
    // Профиль намеренно не в зависимостях: токен нужно погасить ровно один раз.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (status === "pending") {
    return <AuthShell title="Подтверждаем почту…" />;
  }

  if (status === "failed") {
    return (
      <AuthShell title="Ссылка не сработала">
        <p className="auth-error" role="alert">{error}</p>
        <Link className="auth-submit" href="/login">Ко входу</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Почта подтверждена" subtitle="Теперь можно публиковать билды и комментарии.">
      <Link className="auth-submit" href="/">На главную</Link>
    </AuthShell>
  );
}
