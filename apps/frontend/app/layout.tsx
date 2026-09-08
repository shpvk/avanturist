import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter_Tight } from "next/font/google";
import { MotionProvider } from "./_motion/motion-provider";
import "./styles.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const tagline = "Verdicts on the Dota 2 builds that look wrong and might be right.";

export const metadata: Metadata = {
  applicationName: "BuildVerdict",
  title: "build verdict",
  description:
    "A forum for adventurous Dota 2 builds: judge the idea, argue in the comments and publish your own.",
  keywords: ["Dota 2", "builds", "hero items", "BuildVerdict"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BuildVerdict",
    title: "BuildVerdict — a verdict on unusual Dota 2 builds",
    description: tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildVerdict — a verdict on unusual Dota 2 builds",
    description: tagline,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#090b08",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${interTight.variable} ${geistMono.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
