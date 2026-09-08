import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const packOrigin = "https://media.steampowered.com/apps/dota2/workshop";

export const heroesWithoutPack = new Set(["wisp"]);

const alternateFormMarkers = [
  "persona", "_cute", "_female", "_kid", "_ult", "demon", "true_form", "spirit_bear", "_bear",
  "spiderling", "archer", "sidegunner", "offhand", "totem", "trainer", "arcana", "immortal",
  "_alt", "ward", "familiar", "golem", "illusion", "courier", "eidolon",
];

const droppedMeshPatterns = [/_lod([1-9]\d*)?$/i, /_noflex$/i, /_weapon$/i, /_offhand/i];

export function heroSlugs() {
  const source = readFileSync(path.join(frontendRoot, "app/_lib/hero-roles.ts"), "utf8");
  const start = source.indexOf("const lanesByRole");
  const end = source.indexOf("const heroLanes");
  if (start < 0 || end < 0) throw new Error("Could not locate the hero list in app/_lib/hero-roles.ts");
  const lanes = source.slice(start, end);
  const slugs = new Set();
  for (const [, slug] of lanes.matchAll(/"([a-z_]+)"/g)) {
    if (!["carry", "mid", "offlane", "support"].includes(slug)) slugs.add(slug);
  }
  return [...slugs].sort();
}

export function buildableHeroSlugs() {
  return heroSlugs().filter((slug) => !heroesWithoutPack.has(slug));
}

export function isAlternateForm(name) {
  const lower = name.toLowerCase();
  return alternateFormMarkers.some((marker) => lower.includes(marker));
}

export function isDroppedMesh(name) {
  return droppedMeshPatterns.some((pattern) => pattern.test(name));
}

export function chooseNestedPack(slug, entries) {
  const compact = slug.replaceAll("_", "");
  const scored = entries.map((entry) => {
    const stem = path.basename(entry.name, ".zip").toLowerCase();
    const stemCompact = stem.replaceAll("_", "");
    let score = 0;
    if (stem === slug) score += 100;
    if (stem === `${slug}_base`) score += 90;
    if (stemCompact === compact) score += 80;
    if (stemCompact.startsWith(compact) || compact.startsWith(stemCompact)) score += 40;
    if (stem.endsWith("_base")) score += 20;
    if (isAlternateForm(stem)) score -= 60;
    return { entry, score, size: entry.size };
  });
  scored.sort((a, b) => b.score - a.score || b.size - a.size);
  return scored[0]?.entry ?? null;
}

export function chooseModelFiles(slug, fbxPaths) {
  const fullQuality = fbxPaths.filter((file) => !/low[-_]violence|(^|\/)lv(\/|_)/i.test(file));
  const candidates = fullQuality.length > 0 ? fullQuality : fbxPaths;
  const usable = candidates.filter((file) => {
    const stem = path.basename(file, ".fbx").toLowerCase();
    return !isAlternateForm(stem) && !isDroppedMesh(stem);
  });
  const pool = usable.length > 0 ? usable : candidates;

  const econ = pool.filter((file) => path.basename(file, ".fbx").toLowerCase().endsWith("_econ"));
  if (econ.length > 0) return [pickShallowest(econ)];

  const whole = pool.filter((file) => path.basename(file, ".fbx").toLowerCase().endsWith("_model"));
  if (whole.length > 0) return [pickShallowest(whole)];

  const named = pool.filter((file) => path.basename(file, ".fbx").toLowerCase() === slug.replaceAll("_", ""));
  if (named.length > 0) return [pickShallowest(named)];

  if (pool.length === 1) return pool;

  const deepest = Math.min(...pool.map((file) => file.split("/").length));
  return pool.filter((file) => file.split("/").length === deepest).sort();
}

function pickShallowest(files) {
  return [...files].sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b))[0];
}
