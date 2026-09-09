import { NodeIO, PropertyType } from "@gltf-transform/core";
import { EXTMeshoptCompression, EXTTextureWebP, KHRMeshQuantization } from "@gltf-transform/extensions";
import { dedup, mergeDocuments, meshopt, prune, unpartition, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import { unzipSync } from "fflate";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildableHeroSlugs, chooseModelFiles, chooseNestedPack, frontendRoot, isDroppedMesh, packOrigin } from "./hero-packs.mjs";

const options = parseArguments(process.argv.slice(2));
const cacheRoot = path.join(frontendRoot, ".cache", "hero-models");
const packRoot = path.join(cacheRoot, "packs");
const workRoot = path.join(cacheRoot, "work");
const toolRoot = path.join(cacheRoot, "tools");
const runtimeRoot = path.join(frontendRoot, "public", "assets", "heroes", "models");
const imageExtensions = new Set([".tga", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"]);
const converterRelease = "https://github.com/godotengine/FBX2glTF/releases/download/v0.13.1";

const slugs = options.only ?? buildableHeroSlugs();
mkdirSync(packRoot, { recursive: true });
mkdirSync(workRoot, { recursive: true });
mkdirSync(runtimeRoot, { recursive: true });

requireFfmpeg();
const converter = await resolveConverter();
await MeshoptEncoder.ready;

const report = [];
for (const [index, slug] of slugs.entries()) {
  const target = path.join(runtimeRoot, slug, "model.glb");
  const position = `[${index + 1}/${slugs.length}]`;
  if (!options.force && existsSync(target)) {
    console.log(`${position} ${slug}: already built, skipping`);
    continue;
  }
  try {
    const result = await buildHero(slug, target);
    report.push({ slug, ...result });
    console.log(
      `${position} ${slug}: ${result.megabytes} MB, ${result.texturedMaterials}/${result.materials} materials textured`,
    );
  } catch (error) {
    report.push({ slug, error: String(error.message ?? error) });
    console.log(`${position} ${slug}: FAILED — ${error.message ?? error}`);
  } finally {
    rmSync(path.join(workRoot, slug), { recursive: true, force: true });
  }
}

writeFileSync(path.join(cacheRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
const failed = report.filter((entry) => entry.error);
const untextured = report.filter((entry) => !entry.error && entry.texturedMaterials === 0);
console.log(`\nBuilt ${report.length - failed.length}/${report.length}; failed ${failed.length}; untextured ${untextured.length}`);
if (failed.length > 0) console.log(`Failed: ${failed.map((entry) => entry.slug).join(", ")}`);
if (untextured.length > 0) console.log(`Untextured: ${untextured.map((entry) => entry.slug).join(", ")}`);

async function buildHero(slug, target) {
  const packPath = await ensurePack(slug);
  const heroWork = path.join(workRoot, slug);
  rmSync(heroWork, { recursive: true, force: true });
  mkdirSync(heroWork, { recursive: true });

  const modelRoot = extractPack(slug, readFileSync(packPath), heroWork);
  const fbxFiles = collectFiles(modelRoot, (file) => file.toLowerCase().endsWith(".fbx"));
  if (fbxFiles.length === 0) throw new Error("Pack contains no FBX file");

  const relativeFbx = fbxFiles.map((file) => path.relative(modelRoot, file).split(path.sep).join("/"));
  const selected = chooseModelFiles(slug, relativeFbx).map((file) => path.join(modelRoot, file));

  const io = new NodeIO()
    .registerExtensions([EXTTextureWebP, EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptEncoder });

  let document = null;
  for (const [index, fbx] of selected.entries()) {
    const converted = path.join(heroWork, `part-${index}`);
    execFileSync(converter, ["--binary", "--skinning-weights", "4", "--compute-normals", "broken", "--input", fbx, "--output", converted], {
      cwd: path.dirname(fbx),
      stdio: "pipe",
    });
    const part = await io.read(`${converted}.glb`);
    rmSync(`${converted}.glb`, { force: true });
    if (document === null) document = part;
    else appendPart(document, part);
  }
  if (document === null) throw new Error("No FBX file could be converted");

  dropUnposedMeshes(document);
  const textureIndex = indexImages(modelRoot);
  const { materials, texturedMaterials } = applyTextures(document, textureIndex, heroWork, slug, modelRoot);

  await document.transform(prune({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.BUFFER, PropertyType.MATERIAL, PropertyType.TEXTURE, PropertyType.MESH, PropertyType.NODE, PropertyType.SKIN] }), dedup(), weld(), unpartition());
  await document.transform(meshopt({ encoder: MeshoptEncoder, level: "high" }));

  mkdirSync(path.dirname(target), { recursive: true });
  await io.write(target, document);
  return {
    megabytes: (statSync(target).size / 1048576).toFixed(2),
    materials,
    texturedMaterials,
    parts: selected.map((file) => path.relative(modelRoot, file).split(path.sep).join("/")),
  };
}

async function ensurePack(slug) {
  const packPath = path.join(packRoot, `${slug}.zip`);
  if (existsSync(packPath) && statSync(packPath).size > 0) return packPath;
  const response = await fetch(`${packOrigin}/${slug}.zip`);
  if (!response.ok) throw new Error(`Valve pack request failed: ${response.status}`);
  writeFileSync(packPath, Buffer.from(await response.arrayBuffer()));
  return packPath;
}

function extractPack(slug, archive, destination) {
  const entries = unzipSync(archive, {
    filter: (file) => {
      const extension = path.extname(file.name).toLowerCase();
      return extension === ".fbx" || extension === ".zip" || imageExtensions.has(extension);
    },
  });

  const nested = Object.entries(entries)
    .filter(([name]) => name.toLowerCase().endsWith(".zip"))
    .map(([name, data]) => ({ name, data, size: data.length }));
  const hasOwnModel = Object.keys(entries).some((name) => name.toLowerCase().endsWith(".fbx"));

  if (nested.length > 0 && !hasOwnModel) {
    const chosen = chooseNestedPack(slug, nested);
    if (!chosen) throw new Error("Nested pack contains no usable archive");
    return extractPack(slug, chosen.data, destination);
  }

  for (const [name, data] of Object.entries(entries)) {
    if (name.toLowerCase().endsWith(".zip")) continue;
    const file = path.join(destination, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, data);
  }
  return destination;
}

function collectFiles(root, accept) {
  const found = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (accept(full)) found.push(full);
    }
  };
  walk(root);
  return found;
}

function appendPart(document, part) {
  mergeDocuments(document, part);
  const scenes = document.getRoot().listScenes();
  const [main, ...rest] = scenes;
  for (const scene of rest) {
    for (const node of scene.listChildren()) main.addChild(node);
    scene.dispose();
  }
  document.getRoot().setDefaultScene(main);
}

function dropUnposedMeshes(document) {
  for (const node of document.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    if (isDroppedMesh(node.getName()) || isDroppedMesh(mesh.getName())) node.dispose();
  }
  for (const mesh of document.getRoot().listMeshes()) {
    if (isDroppedMesh(mesh.getName()) && mesh.listParents().every((parent) => parent.propertyType !== "Node")) mesh.dispose();
  }
}

function indexImages(root) {
  const index = new Map();
  for (const file of collectFiles(root, (candidate) => imageExtensions.has(path.extname(candidate).toLowerCase()))) {
    const stem = path.basename(file, path.extname(file)).toLowerCase();
    const relative = path.relative(root, file).toLowerCase();
    const rank = relative.includes("models/heroes") || relative.includes("models\\heroes") ? 3 : relative.includes("items") ? 1 : 2;
    for (const base of new Set([stem, stem.replace(/\d+$/, "")])) {
      const segments = base.split("_");
      for (let offset = 0; offset < segments.length; offset += 1) {
        const key = segments.slice(offset).join("_");
        if (offset > 0 && !key.includes("_")) continue;
        const keyRank = rank - offset * 0.1;
        const current = index.get(key);
        if (!current || keyRank > current.rank) index.set(key, { file, rank: keyRank });
      }
    }
  }
  return index;
}

function applyTextures(document, textureIndex, heroWork, slug, modelRoot) {
  const encoded = new Map();
  const fallback = mainTexture(textureIndex, modelRoot);
  const materials = document.getRoot().listMaterials();
  let texturedMaterials = 0;

  for (const material of materials) {
    const existing = material.getBaseColorTexture();
    const existingName = existing?.getName() ?? "";
    const meshNames = material.listParents()
      .filter((parent) => parent.propertyType === "Primitive")
      .flatMap((primitive) => primitive.listParents().map((mesh) => mesh.getName?.() ?? ""));
    const source = textureHints([path.basename(existingName, path.extname(existingName)), material.getName() ?? "", ...meshNames, slug])
      .map((hint) => textureIndex.get(hint))
      .find((entry) => entry !== undefined) ?? fallback;

    if (!source) {
      const mimeType = existing?.getMimeType() ?? "";
      if (mimeType.startsWith("image/") && mimeType !== "image/unknown") texturedMaterials += 1;
      else if (existing) material.setBaseColorTexture(null);
      continue;
    }

    let image = encoded.get(source.file);
    if (!image) {
      image = encodeTexture(source.file, heroWork);
      encoded.set(source.file, image);
    }

    const texture = existing ?? document.createTexture(path.basename(source.file));
    texture.setImage(image).setMimeType("image/webp").setURI("");
    material.setBaseColorTexture(texture);
    texturedMaterials += 1;
  }

  if (texturedMaterials > 0) document.createExtension(EXTTextureWebP).setRequired(true);
  return { materials: materials.length, texturedMaterials };
}

function mainTexture(textureIndex, modelRoot) {
  let best = null;
  for (const [key, entry] of textureIndex) {
    if (!key.endsWith("_color")) continue;
    const size = statSync(entry.file).size;
    const relative = path.relative(modelRoot, entry.file).toLowerCase();
    if (relative.includes("items")) continue;
    if (!best || size > best.size) best = { ...entry, size };
  }
  return best;
}

function textureHints(names) {
  const hints = [];
  const add = (value) => {
    const stem = value.trim().toLowerCase();
    if (stem.length > 2 && !hints.includes(stem)) hints.push(stem);
  };
  const bases = new Set();
  for (const name of names) {
    if (!name) continue;
    for (const part of [name, ...name.split(":")]) {
      const trimmed = part
        .replace(/\.(tga|png|jpg|jpeg|tif|tiff|bmp)$/i, "")
        .replace(/_(mat|material|mesh|model|low|lod|sg|\d+k)$/i, "")
        .replace(/(low)?sg$/i, "");
      for (const stem of [trimmed, trimmed.replace(/\d+$/, "")]) {
        if (!stem) continue;
        bases.add(stem);
        bases.add(stem.replace(/_(mat|material|mesh|model|color|diffuse|base)$/i, ""));
      }
    }
  }
  for (const base of bases) {
    add(base);
    add(`${base}_color`);
  }
  for (const base of bases) {
    const segments = base.split("_");
    for (let index = 1; index < segments.length; index += 1) {
      const tail = segments.slice(index).join("_");
      if (tail.includes("_")) {
        add(tail);
        add(`${tail}_color`);
      }
    }
    if (segments.length > 1) add(`${segments[0]}_color`);
  }
  return hints;
}

function encodeTexture(source, heroWork) {
  const target = path.join(heroWork, "texture.webp");
  rmSync(target, { force: true });
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", source,
    "-vf", `scale='min(${options.textureSize},iw)':'min(${options.textureSize},ih)':force_original_aspect_ratio=decrease,format=rgb24`,
    "-c:v", "libwebp", "-compression_level", "6", "-quality", String(options.textureQuality),
    target,
  ]);
  return new Uint8Array(readFileSync(target));
}

async function resolveConverter() {
  if (options.converter) return path.resolve(options.converter);
  const platform = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux";
  const name = `FBX2glTF-${platform}-x86_64`;
  const binary = path.join(toolRoot, name, process.platform === "win32" ? `${name}.exe` : name);
  if (existsSync(binary)) return binary;

  mkdirSync(toolRoot, { recursive: true });
  const response = await fetch(`${converterRelease}/${name}.zip`);
  if (!response.ok) throw new Error(`FBX2glTF download failed: ${response.status}`);
  const entries = unzipSync(new Uint8Array(await response.arrayBuffer()));
  for (const [entry, data] of Object.entries(entries)) {
    if (data.length === 0) continue;
    const file = path.join(toolRoot, entry);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, data, { mode: entry.includes(name) && !entry.includes(".") ? 0o755 : 0o644 });
  }
  if (!existsSync(binary)) throw new Error(`FBX2glTF archive did not contain ${binary}`);
  return binary;
}

function requireFfmpeg() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "pipe" });
  } catch {
    throw new Error("ffmpeg is required to transcode Valve's TGA textures; install it and retry");
  }
}

function parseArguments(argv) {
  const parsed = { only: null, force: false, textureSize: 1024, textureQuality: 82, converter: null };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === "--only") { parsed.only = value.split(",").map((slug) => slug.trim()).filter(Boolean); index += 1; }
    else if (flag === "--force") parsed.force = true;
    else if (flag === "--textures") { parsed.textureSize = Number(value); index += 1; }
    else if (flag === "--quality") { parsed.textureQuality = Number(value); index += 1; }
    else if (flag === "--converter") { parsed.converter = value; index += 1; }
    else throw new Error(`Unknown argument: ${flag}`);
  }
  return parsed;
}
