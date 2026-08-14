import type { Metadata } from "next";
import { headers } from "next/headers";
import BuildVerdictClient from "./build-verdict-client";
import { getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", origin);

  return {
    title: { absolute: "BuildVerdict — оцени билды Dota 2" },
    description: "Оценивай случайные билды героев и смотри экспериментальные сборки сообщества.",
    alternates: { canonical: new URL("/", origin) },
    openGraph: {
      title: "BuildVerdict — вердикт необычным билдам Dota 2",
      description: "Оценивай экспериментальные сборки героев и находи новые игровые идеи.",
      url: origin,
      images: [{ url: socialImage, width: 1200, height: 630, alt: "BuildVerdict — вердикт необычным билдам Dota 2" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "BuildVerdict — вердикт необычным билдам Dota 2",
      description: "Оценивай экспериментальные сборки героев и находи новые игровые идеи.",
      images: [socialImage],
    },
  };
}

export default async function Home() {
  const user = await getChatGPTUser();

  return <BuildVerdictClient initialUser={user ? { name: user.displayName, email: user.email } : null} />;
}
