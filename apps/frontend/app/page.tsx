import type { Metadata } from "next";
import BuildVerdictClient from "./build-verdict-client";

export const metadata: Metadata = {
  title: "BuildVerdict — оцени билды Dota 2",
  description: "Оценивай случайные билды героев и смотри свежие сборки сообщества.",
};

export default function Home() {
  return <BuildVerdictClient />;
}
