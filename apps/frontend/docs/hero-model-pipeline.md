# Hero model pipeline

The browser never loads the original FBX files. Source models and textures live in
`model-sources/heroes/<slug>/`; production-ready self-contained GLB files live in
`public/assets/heroes/models/<slug>/model.glb`.

The current source packages are the hero reference assets linked from Valve's official
[Dota 2 Workshop](https://www.dota2.com/workshop/requirements). Keep a record of the exact
Valve page and archive version whenever another hero is added. Before commercial use,
the project owner must confirm that the intended use complies with Valve's terms and
fan-content policy.

## Conversion

1. Download the Windows x86_64 archive from the official Godot
   [FBX2glTF v0.13.1 release](https://github.com/godotengine/FBX2glTF/releases/tag/v0.13.1).
2. Put each hero's `model.fbx` and `materials/` directory in
   `model-sources/heroes/<slug>/`.
3. Add the slug to `scripts/convert-hero-models.ps1`.
4. Run:

   ```powershell
   ./scripts/convert-hero-models.ps1 -Converter C:\path\to\FBX2glTF-windows-x86_64.exe
   ```

The script embeds the correctly assigned color textures, geometry and skeleton into one
GLB per hero. It keeps the large FBX and PNG sources outside `public`, so a production
build publishes only the runtime GLB files.

## Runtime and production

`app/hero-model-viewer.tsx` loads GLB through Three.js `GLTFLoader`. Dragging rotates the
model; the wheel adds inertial horizontal rotation. If WebGL or the GLB request fails, the
viewer leaves the static poster visible.

Today the GLB URLs are same-origin static assets, so local, preview and production builds
behave identically without relying on a third-party model host. When the catalogue grows,
the same files can move to object storage/CDN behind a slug-to-versioned-URL manifest; the
viewer contract does not need to change.
