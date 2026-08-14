import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildVerdict",
  description: "Сообщество билдов Dota 2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
