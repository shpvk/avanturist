"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "../_components/auth-shell";
import { GoogleButton } from "../_components/google-button";
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
      router.push("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось войти.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Вход в аккаунт"
      footer={
        <>
          Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
        </>
      }
    >
      <GoogleButton />
      <div className="auth-divider"><span>или</span></div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field" htmlFor="login-email">
          <span className="auth-label">Почта</span>
          <span className="auth-input-wrap">
            <input
              id="login-email"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="Почта"
              required
              onChange={(event) => setEmail(event.target.value)}
            />
          </span>
        </label>

        <PasswordField
          id="login-password"
          label="Пароль"
          value={password}
          autoComplete="current-password"
          onChange={setPassword}
        />

        <Link className="auth-inline-link" href="/auth/password-reset">Забыли пароль?</Link>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Входим…" : "Войти"}
        </button>
      </form>
    </AuthShell>
  );
}
