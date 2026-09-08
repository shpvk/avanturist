# Hero model pipeline

The browser never loads the original FBX files. Production-ready self-contained GLB files
live in `public/assets/heroes/models/<slug>/model.glb`, one per hero, and they are the only
model assets the repository ships.

The sources are the official hero reference packs Valve publishes for the
[Dota 2 Workshop](https://www.dota2.com/workshop/requirements): every hero page links a
`https://media.steampowered.com/apps/dota2/workshop/<slug>.zip` archive. `scripts/build-hero-models.mjs`
downloads those archives itself, so nothing but the finished GLB is kept in git. Io (`wisp`)
is the one hero without a reference pack; the viewer keeps showing its poster instead.
Before commercial use, the project owner must confirm that the intended use complies with
Valve's terms and fan-content policy.

## Building

```bash
npm run hero-models              # every hero that has no model.glb yet
npm run hero-models -- --force   # rebuild everything
npm run hero-models -- --only pudge,marci --force
```

`ffmpeg` must be on `PATH`; Valve ships its textures as TGA, which no browser reads. The
FBX2glTF binary is downloaded once into `.cache/hero-models/tools`, the hero archives are
cached in `.cache/hero-models/packs`, and each hero is unpacked into
`.cache/hero-models/work` and deleted again right after its GLB is written. A full run
therefore needs a few gigabytes of scratch space but leaves no sources behind. The run
also writes `.cache/hero-models/report.json` with the per-hero size and how many of its
materials ended up textured.

Flags: `--textures <px>` (default 1024) caps the texture edge, `--quality <n>` (default 82)
is the WebP quality, and `--converter <path>` uses an FBX2glTF binary you already have.

## What the script has to normalise

Valve's archives are not uniform, and the three shapes need different handling:

- Newer heroes ship a single `<hero>_econ.fbx` next to a `materials/` directory.
- Older heroes ship one FBX per body slot under `models/heroes/<hero>/fbx/`. When a
  `<hero>_model.fbx` covers the whole hero it wins; otherwise the slots are converted
  separately and merged into one document.
- Some heroes ship nested archives, one per form (`pudge_base.zip` and `pudge_cute.zip`,
  `crystal_maiden_base.zip` and `cm_persona.zip`). `chooseNestedPack` in `scripts/hero-packs.mjs`
  keeps the base form and drops personas, arcanas, summons and alternate shapes.

Textures are just as irregular. The Source 1 packs carry no texture reference inside the
FBX at all, and their material names arrive mangled by Maya namespaces and the deduplication
suffixes FBX2glTF appends — `razor_armor:razor_body_mat`, `luna_head_color2`,
`witchdoctor_belt_model_witchdoctor_belt_mat`. `textureHints` therefore expands a material
name into candidates (namespace halves, trailing digits stripped, `_mat`/`_model` suffixes
removed, `_color` appended, then progressively shorter tails) and matches them against an
index of every image in the archive, preferring files under `models/heroes` over item art.
Each match is re-encoded to WebP at 1024 px. If a hero ever lands with zero textured
materials the run reports it, because the viewer would fall back to its poster.

Meshes whose name ends in `_lod`/`_lod<n>`, `_noflex`, `_weapon` or contains `_offhand` are
dropped during the build. LOD copies are redundant, and the weapon slots are unposed: Valve
poses the body, the armour and the hats, but the game attaches weapons to hand bones at
runtime, so in the file's own rest pose Anti-Mage's blades lie flat under his feet. The
runtime keeps the same filter for models built before this rule existed. Belt knives and
other props the source does pose (`pudge_belt_knives`) stay.

Finally the document is pruned, deduplicated, welded and compressed with `EXT_meshopt_compression`,
which is what keeps a hero around 0.3-1 MB instead of the 30-140 MB the archive weighs.

## Runtime and production

`app/_hero-model/hero-scene.ts` loads GLB through Three.js `GLTFLoader` with `MeshoptDecoder`
(bundled with `three`, so no decoder files are served from `public`). Dragging rotates the
model; the wheel adds inertial horizontal rotation. While the model downloads,
`app/_hero-model/hero-model-viewer.tsx` shows only the stage background and a loading
indicator, so a different pose never flashes first. If WebGL, the GLB request or the
embedded textures fail, the viewer leaves the static poster visible instead of showing an
untextured white silhouette — `GLTFLoader` swallows an image it cannot load and returns a
material with no `map`, so the scene checks for that explicitly.

Today the GLB URLs are same-origin static assets, so local, preview and production builds
behave identically without relying on a third-party model host. The whole catalogue is
roughly 60 MB, and only the hero being viewed is ever downloaded. If that becomes a
deployment problem, the same files can move to object storage/CDN behind a slug-to-versioned-URL
manifest; the viewer contract does not need to change.
