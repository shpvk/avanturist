"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "../_components/auth-shell";
import { PasswordField } from "../_components/password-field";
import { useAuth } from "../_hooks/use-auth";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      router.push("/app");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Log in"
      footer={
        <>
          No account yet? <Link href="/register">Sign up</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field" htmlFor="login-email">
          <span className="auth-label">Email</span>
          <span className="auth-input-wrap">
            <input
              id="login-email"
              type="email"
              value={email}
              autoComplete="email"
              required
              onChange={(event) => setEmail(event.target.value)}
            />
          </span>
        </label>

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          autoComplete="current-password"
          onChange={setPassword}
        />

        <Link className="auth-inline-link" href="/auth/password-reset">Forgot your password?</Link>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
