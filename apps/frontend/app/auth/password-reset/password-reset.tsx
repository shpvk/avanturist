"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "../../_components/auth-shell";
import { PasswordField } from "../../_components/password-field";
import { confirmPasswordReset, requestPasswordReset } from "../../_lib/auth-api";

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
      setError(cause instanceof Error ? cause.message : "Could not send the message.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="If that address is registered, a link is already on its way."
      >
        <Link className="auth-submit" href="/login">Go to login</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will send you a link to set a new one."
      footer={<Link href="/login">Back to login</Link>}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field" htmlFor="reset-email">
          <span className="auth-label">Email</span>
          <span className="auth-input-wrap">
            <input
              id="reset-email"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="Email"
              required
              onChange={(event) => setEmail(event.target.value)}
            />
          </span>
        </label>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send the link"}
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
      router.push("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not change the password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="New password" subtitle="Changing it will end every active session.">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="reset-password"
          label="New password"
          value={password}
          autoComplete="new-password"
          onChange={setPassword}
        />
        <PasswordField
          id="reset-password-repeat"
          label="Repeat the password"
          value={passwordRepeat}
          autoComplete="new-password"
          onChange={setPasswordRepeat}
        />

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save password"}
        </button>
      </form>
    </AuthShell>
  );
}
