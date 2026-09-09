"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "../../_components/auth-shell";
import { useAuth } from "../../_hooks/use-auth";
import { useResendVerification } from "../../_hooks/use-resend-verification";

export function CheckEmail() {
  const params = useSearchParams();
  const { user } = useAuth();
  const email = user?.email ?? params.get("email") ?? "";
  const { state, error, cooldown, isBusy, resend } = useResendVerification(
    email,
    params.get("sent") === "0"
      ? "The message could not be sent — the mail service did not respond. Please try again."
      : null,
  );

  if (user?.isVerified) {
    return (
      <AuthShell title="Email confirmed" subtitle="You can publish builds and comments now.">
        <Link className="auth-submit" href="/">Back home</Link>
      </AuthShell>
    );
  }

  if (!email) {
    return (
      <AuthShell
        title="Confirm your email"
        subtitle="Log in to send the message again."
      >
        <Link className="auth-submit" href="/login">Go to login</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Check your email"
      subtitle={`We sent a link to ${email}. It is valid for 24 hours.`}
      footer={<Link href="/">Back home</Link>}
    >
      <div className="auth-form">
        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        {state === "sent" ? (
          <p className="auth-status" role="status">
            The message has been sent again. Check your spam folder too.
          </p>
        ) : null}

        <button
          className="auth-submit"
          type="button"
          disabled={isBusy}
          onClick={resend}
        >
          {state === "sending"
            ? "Sending…"
            : cooldown > 0
              ? `Send again in ${cooldown}s`
              : "Send the message again"}
        </button>
      </div>
    </AuthShell>
  );
}
