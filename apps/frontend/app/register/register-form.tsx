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
      router.push("/?registered=1");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Your builds and comments unlock once you confirm your email."
      footer={
        <>
          Already have an account? <Link href="/login">Log in</Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" />
      <div className="auth-divider"><span>or</span></div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field" htmlFor="register-name">
          <span className="auth-label">Name</span>
          <span className="auth-input-wrap">
            <input
              id="register-name"
              type="text"
              value={name}
              autoComplete="nickname"
              required
              onChange={(event) => setName(event.target.value)}
            />
          </span>
        </label>

        <label className="auth-field" htmlFor="register-email">
          <span className="auth-label">Email</span>
          <span className="auth-input-wrap">
            <input
              id="register-email"
              type="email"
              value={email}
              autoComplete="email"
              required
              onChange={(event) => setEmail(event.target.value)}
            />
          </span>
        </label>

        <PasswordField
          id="register-password"
          label="Password"
          value={password}
          autoComplete="new-password"
          onChange={setPassword}
        />

        <PasswordField
          id="register-password-repeat"
          label="Repeat password"
          value={passwordRepeat}
          autoComplete="new-password"
          onChange={setPasswordRepeat}
        />

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
