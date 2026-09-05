import type { Metadata } from "next";
import { VerifyEmail } from "./verify-email";

export const metadata: Metadata = { title: "Подтверждение почты" };

export default function VerifyPage() {
  return <VerifyEmail />;
}
