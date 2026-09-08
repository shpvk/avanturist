"use client";

import Link from "next/link";
import { useAuth } from "../_hooks/use-auth";
import { useResendVerification } from "../_hooks/use-resend-verification";

export function VerificationBanner() {
  const { user } = useAuth();
  const { state, error, cooldown, isBusy, resend } = useResendVerification(user?.email ?? "");

  if (!user || user.isVerified) return null;

  return (
    <aside className="verify-banner">
      <p>
        Your email{" "}
        <strong className="verify-banner-email">
          {user.email.slice(0, 1)}
          <span aria-hidden="true">{user.email.slice(1)}</span>
        </strong>{" "}
        is not confirmed — commenting and publishing builds are closed. The link in the
        message is valid for 24 hours; check your spam folder too.
      </p>
      <div className="verify-banner-actions">
        {state === "sent" && (
          <span className="verify-banner-note" role="status">Message sent</span>
        )}
        {error && (
          <span className="verify-banner-error" role="alert">{error}</span>
        )}
        <button type="button" onClick={resend} disabled={isBusy}>
          {state === "sending"
            ? "Sending…"
            : cooldown > 0
              ? `Again in ${cooldown}s`
              : "Send the message again"}
        </button>
        <Link href="/auth/check-email">Details</Link>
      </div>
    </aside>
  );
}
