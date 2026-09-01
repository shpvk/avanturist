import type { Metadata } from "next";
import { PasswordReset } from "./password-reset";

export const metadata: Metadata = { title: "Сброс пароля" };

export default function PasswordResetPage() {
  return <PasswordReset />;
}
