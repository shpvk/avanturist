import type { Metadata } from "next";
import { OAuthCallback } from "./oauth-callback";

export const metadata: Metadata = { title: "Вход через Google" };

export default function CallbackPage() {
  return <OAuthCallback />;
}
