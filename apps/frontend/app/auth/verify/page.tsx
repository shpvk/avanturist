import type { Metadata } from "next";
import { VerifyEmail } from "./verify-email";

export const metadata: Metadata = { title: "Email confirmation" };

export default function VerifyPage() {
  return <VerifyEmail />;
}
