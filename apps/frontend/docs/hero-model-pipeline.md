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

`app/_hero-model/hero-scene.ts` loads GLB through Three.js `GLTFLoader`. Dragging rotates
the model; the wheel adds inertial horizontal rotation. If WebGL, the GLB request or the
embedded textures fail, the viewer leaves the static poster visible instead of showing an
untextured white silhouette — `GLTFLoader` swallows an image it cannot load and returns a
material with no `map`, so the scene checks for that explicitly.

## Unposed weapon slots

Valve's reference models pose the body, the armour and the hats, but not the weapon
slots: the game attaches those to hand bones at runtime. In the file's own rest pose
Anti-Mage's blades lie flat on the floor under his feet, Pudge's hook stands about a metre
to his right, and Phantom Assassin's dagger sinks halfway through the ground. The .glb
carries nothing to fix them with — its single animation take (`Take 001`) has no channels
— so the scene drops every mesh whose name ends in `_weapon` or `_offhand` and frames the
hero itself. Belt knives and other props the source does pose (`pudge_belt_knives`) stay.
A newly added hero follows the same naming, so nothing has to be listed per hero.

Today the GLB URLs are same-origin static assets, so local, preview and production builds
behave identically without relying on a third-party model host. When the catalogue grows,
the same files can move to object storage/CDN behind a slug-to-versioned-URL manifest; the
viewer contract does not need to change.
