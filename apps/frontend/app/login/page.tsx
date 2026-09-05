"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ApiError, login, register } from "../_lib/api";
import { safeRelativeReturnPath } from "../_lib/auth-paths";

type Mode = "login" | "register";

/** Mirrors RegisterDto on the API: @MinLength(6) on the password. */
const minPasswordLength = 6;

/** Where to land after a successful sign-in, taken from ?return_to and stripped of off-site targets. */
function returnPath(): string {
  if (typeof window === "undefined") return "/";
  return safeRelativeReturnPath(new URLSearchParams(window.location.search).get("return_to") ?? "/");
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setIsSending(true);
    setError(null);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({
          name: String(form.get("name") ?? "").trim(),
          email,
          password,
          passwordRepeat: String(form.get("passwordRepeat") ?? ""),
        });
      }
      // A full navigation, so the page reloads with the session cookie in hand.
      window.location.assign(returnPath());
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Сервер недоступен. Попробуйте ещё раз.");
      setIsSending(false);
    }
  };

  const switchTo = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="site-shell auth-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="wordmark" href="/" aria-label="BuildVerdict — главная">build<span>verdict</span></Link>
        </div>
      </header>
      <main className="auth-main">
        <section className="auth-card" aria-labelledby="auth-title">
          <span className="eyebrow">Аккаунт</span>
          <h1 id="auth-title">{mode === "login" ? "Вход" : "Регистрация"}</h1>
          <p className="auth-lead">
            {mode === "login" ? "Войдите, чтобы билды и оценки остались за вами." : "Заведите аккаунт — это займёт полминуты."}
          </p>
          <div className="auth-modes" role="group" aria-label="Вход или регистрация">
            <button className={mode === "login" ? "selected" : ""} type="button" aria-pressed={mode === "login"} onClick={() => switchTo("login")}>Вход</button>
            <button className={mode === "register" ? "selected" : ""} type="button" aria-pressed={mode === "register"} onClick={() => switchTo("register")}>Регистрация</button>
          </div>
          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <label className="form-field"><span>Имя</span><input name="name" type="text" autoComplete="nickname" minLength={1} maxLength={40} placeholder="Как вас показывать" required /></label>
            )}
            <label className="form-field"><span>Почта</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label className="form-field">
              <span>Пароль</span>
              <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : minPasswordLength} placeholder={mode === "login" ? "Ваш пароль" : `Минимум ${minPasswordLength} символов`} required />
            </label>
            {mode === "register" && (
              <label className="form-field"><span>Пароль ещё раз</span><input name="passwordRepeat" type="password" autoComplete="new-password" minLength={minPasswordLength} placeholder="Повторите пароль" required /></label>
            )}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="submit-build-button" type="submit" disabled={isSending}>
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>
          <Link className="auth-back" href="/">← К билдам</Link>
        </section>
      </main>
    </div>
  );
}
