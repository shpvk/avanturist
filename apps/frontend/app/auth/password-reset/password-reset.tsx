"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "../../_components/auth-shell";
import { PasswordField } from "../../_components/password-field";
import { confirmPasswordReset, requestPasswordReset } from "../../_lib/auth-api";

/** Одна страница на два шага: запрос письма и установка нового пароля по токену. */
export function PasswordReset() {
  const params = useSearchParams();
  const token = params.get("token");

  return token ? <ConfirmStep token={token} /> : <RequestStep />;
}

function RequestStep() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setIsSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось отправить письмо.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    // Ответ одинаков и для существующего, и для неизвестного адреса.
    return (
      <AuthShell
        title="Проверьте почту"
        subtitle="Если такой адрес зарегистрирован, письмо со ссылкой уже отправлено."
      >
        <Link className="auth-submit" href="/login">Ко входу</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Сброс пароля"
      subtitle="Пришлём ссылку для смены пароля."
      footer={<Link href="/login">Вернуться ко входу</Link>}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field" htmlFor="reset-email">
          <span className="auth-label">Почта</span>
          <span className="auth-input-wrap">
            <input
              id="reset-email"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="Почта"
              required
              onChange={(event) => setEmail(event.target.value)}
            />
          </span>
        </label>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Отправляем…" : "Отправить ссылку"}
        </button>
      </form>
    </AuthShell>
  );
}

function ConfirmStep({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await confirmPasswordReset(token, password, passwordRepeat);
      // Смена пароля гасит все сессии, поэтому дальше только новый вход.
      router.push("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сменить пароль.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Новый пароль" subtitle="После смены пароля все сессии будут завершены.">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="reset-password"
          label="Новый пароль"
          value={password}
          autoComplete="new-password"
          onChange={setPassword}
        />
        <PasswordField
          id="reset-password-repeat"
          label="Пароль ещё раз"
          value={passwordRepeat}
          autoComplete="new-password"
          onChange={setPasswordRepeat}
        />

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем…" : "Сохранить пароль"}
        </button>
      </form>
    </AuthShell>
  );
}
