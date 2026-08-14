import { access, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

const DEPLOY_EXCLUDED_PUBLIC_ASSETS = [
  "file.svg",
  "globe.svg",
  "window.svg",
  "assets/heroes/community-avatar.jpg",
  "assets/heroes/spectre.png",
  "assets/heroes/renders/antimage.png",
  "assets/heroes/renders/leshrac.png",
  "assets/heroes/renders/phantom_assassin.png",
  "assets/heroes/renders/pudge.png",
  "assets/heroes/renders/shadow_shaman.png",
  "assets/items/aether_lens.png",
  "assets/items/bfury.png",
  "assets/items/monkey_king_bar.png",
  "assets/items/power_treads.png",
  "assets/items/ring_of_health.png",
  "assets/items/skadi.png",
] as const;

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

// Packages Sites metadata and migrations after Vite finishes compiling.
export function sites(): Plugin {
  let root = process.cwd();

  return {
    name: "sites",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async closeBundle() {
      const outputDirectory = resolve(root, "dist", ".openai");
      const publicOutputDirectory = resolve(root, "dist", "client");
      const hostingConfig = resolve(root, ".openai", "hosting.json");
      const drizzleSource = resolve(root, "drizzle");

      await rm(outputDirectory, { recursive: true, force: true });
      await mkdir(outputDirectory, { recursive: true });

      if (await exists(hostingConfig)) {
        await cp(hostingConfig, resolve(outputDirectory, "hosting.json"));
      }
      if (await exists(drizzleSource)) {
        await cp(drizzleSource, resolve(outputDirectory, "drizzle"), {
          recursive: true,
        });
      }

      // Vite copies public/ wholesale. Keep source originals available for
      // future design work without shipping files that the application never
      // requests in production.
      await Promise.all(
        DEPLOY_EXCLUDED_PUBLIC_ASSETS.map((asset) =>
          rm(resolve(publicOutputDirectory, asset), { force: true }),
        ),
      );
    },
  };
}
