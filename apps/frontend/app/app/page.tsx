import type { Metadata } from "next";
import { headers } from "next/headers";
import BuildVerdictClient from "./build-verdict-client";
import { loadBuild, loadFeed } from "../_lib/feed";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", origin);

  return {
    description: "Spin a random hero, judge the build and argue about it.",
    alternates: { canonical: new URL("/app", origin) },
    openGraph: {
      title: "BuildVerdict — a verdict on unusual Dota 2 builds",
      description: "Judge experimental hero builds and find new ways to play.",
      url: new URL("/app", origin),
      images: [{ url: socialImage, width: 1200, height: 630, alt: "BuildVerdict — a verdict on unusual Dota 2 builds" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "BuildVerdict — a verdict on unusual Dota 2 builds",
      description: "Judge experimental hero builds and find new ways to play.",
      images: [socialImage],
    },
  };
}

export default async function Home({ searchParams }: { searchParams: Promise<{ build?: string; add?: string }> }) {
  const [feed, { build: buildId, add }] = await Promise.all([loadFeed(), searchParams]);
  const initialBuild = buildId && feed.source === "api" ? await loadBuild(buildId, feed.heroes) : undefined;

  return (
    <BuildVerdictClient
      initialBuilds={feed.builds}
      initialTotal={feed.total}
      initialBuild={initialBuild}
      heroes={feed.heroes}
      addBuildRequested={add === "1"}
    />
  );
}
