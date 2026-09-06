"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "../../_components/auth-shell";
import { useAuth } from "../../_hooks/use-auth";
import { exchangeOAuthCode } from "../../_lib/auth-api";

export function OAuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");

    if (!code) {
      setError("Google не вернул код авторизации.");
      return;
    }

    let cancelled = false;

    exchangeOAuthCode(code)
      .then((session) => {
        if (cancelled) return;
        setUser(session.user);
        router.replace("/");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Не удалось завершить вход.");
      });

    return () => {
      cancelled = true;
    };
  }, [params, router, setUser]);

  return (
    <AuthShell title={error ? "Вход не удался" : "Завершаем вход…"}>
      {error ? (
        <>
          <p className="auth-error" role="alert">{error}</p>
          <Link className="auth-submit" href="/login">Вернуться ко входу</Link>
        </>
      ) : (
        <p className="auth-subtitle">Обмениваем код Google на сессию.</p>
      )}
    </AuthShell>
  );
}
