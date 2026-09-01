"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "../_components/auth-shell";
import { GoogleButton } from "../_components/google-button";
import { PasswordField } from "../_components/password-field";
import { useAuth } from "../_hooks/use-auth";

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({ name, email, password, passwordRepeat });
      // Вход уже состоялся: письмо о подтверждении ждёт, публикация до него закрыта.
      router.push("/?registered=1");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось зарегистрироваться.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Создать аккаунт"
      subtitle="Свои билды и комментарии открываются после подтверждения почты."
      footer={
        <>
          Уже есть аккаунт? <Link href="/login">Войти</Link>
        </>
      }
    >
      <GoogleButton label="Зарегистрироваться через Google" />
      <div className="auth-divider"><span>или</span></div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field" htmlFor="register-name">
          <span className="auth-label">Имя</span>
          <span className="auth-input-wrap">
            <input
              id="register-name"
              type="text"
              value={name}
              autoComplete="nickname"
              placeholder="Как вас подписывать"
              required
              onChange={(event) => setName(event.target.value)}
            />
          </span>
        </label>

        <label className="auth-field" htmlFor="register-email">
          <span className="auth-label">Почта</span>
          <span className="auth-input-wrap">
            <input
              id="register-email"
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
          id="register-password"
          label="Пароль"
          value={password}
          autoComplete="new-password"
          onChange={setPassword}
        />

        <PasswordField
          id="register-password-repeat"
          label="Пароль ещё раз"
          value={passwordRepeat}
          autoComplete="new-password"
          onChange={setPasswordRepeat}
        />

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Создаём…" : "Зарегистрироваться"}
        </button>
      </form>
    </AuthShell>
  );
}
