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
      setError("The link does not contain a confirmation token.");
      return;
    }

    let cancelled = false;

    verifyEmail(token)
      .then((profile) => {
        if (cancelled) return;
        if (user?.id === profile.id) setUser(profile);
        setStatus("done");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setStatus("failed");
        setError(cause instanceof Error ? cause.message : "Could not confirm the email.");
      });

    return () => {
      cancelled = true;
    };
  }, [params]);

  if (status === "pending") {
    return <AuthShell title="Confirming your email…" />;
  }

  if (status === "failed") {
    return (
      <AuthShell title="That link did not work">
        <p className="auth-error" role="alert">{error}</p>
        <Link className="auth-submit" href="/login">Go to login</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Email confirmed" subtitle="You can publish builds and comments now.">
      <Link className="auth-submit" href="/">Back home</Link>
    </AuthShell>
  );
}
