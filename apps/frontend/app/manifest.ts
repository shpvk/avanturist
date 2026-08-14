import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BuildVerdict",
    short_name: "BuildVerdict",
    description: "Сообщество необычных и экспериментальных билдов Dota 2.",
    start_url: "/",
    display: "standalone",
    background_color: "#080b10",
    theme_color: "#5274f5",
    lang: "ru",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
