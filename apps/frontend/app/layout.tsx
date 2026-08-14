import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "BuildVerdict",
  title: {
    default: "BuildVerdict — оцени билды Dota 2",
    template: "%s — BuildVerdict",
  },
  description: "Сообщество необычных и экспериментальных билдов Dota 2: оценивай идеи, изучай предметы и делись своими сборками.",
  keywords: ["Dota 2", "билды", "сборки героев", "BuildVerdict"],
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "BuildVerdict",
    title: "BuildVerdict — вердикт необычным билдам Dota 2",
    description: "Оценивай экспериментальные сборки героев и находи новые игровые идеи.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildVerdict — вердикт необычным билдам Dota 2",
    description: "Оценивай экспериментальные сборки героев и находи новые игровые идеи.",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080b10" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
  ],
};

const themeBootstrap = `(() => { try { const saved = localStorage.getItem("buildverdict-theme"); const theme = saved === "light" || saved === "dark" ? saved : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); document.documentElement.dataset.theme = theme; } catch {} })();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body>{children}</body>
    </html>
  );
}
