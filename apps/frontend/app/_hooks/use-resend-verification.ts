"use client";

import { useEffect, useState } from "react";
import { resendVerification } from "../_lib/auth-api";

const cooldownSeconds = 60;

export type ResendState = "idle" | "sending" | "sent" | "failed";

export type UseResendVerificationResult = {
  state: ResendState;
  error: string | null;
  cooldown: number;
  isBusy: boolean;
  resend: () => Promise<void>;
};

export function useResendVerification(
  email: string,
  initialError: string | null = null,
): UseResendVerificationResult {
  const [state, setState] = useState<ResendState>(initialError ? "failed" : "idle");
  const [error, setError] = useState<string | null>(initialError);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => setCooldown((left) => left - 1), 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const isBusy = state === "sending" || cooldown > 0;

  async function resend() {
    if (!email || isBusy) return;

    setState("sending");
    setError(null);

    try {
      await resendVerification(email);
      setState("sent");
      setCooldown(cooldownSeconds);
    } catch (cause) {
      setState("failed");
      setError(cause instanceof Error ? cause.message : "Could not send the message.");
    }
  }

  return { state, error, cooldown, isBusy, resend };
}
