import type * as ThreeNamespace from "three";

type ThreeModule = typeof import("three");
type OrbitControlsModule = typeof import("three/addons/controls/OrbitControls.js");
type GLTFLoaderModule = typeof import("three/addons/loaders/GLTFLoader.js");

type Libs = {
  THREE: ThreeModule;
  OrbitControls: OrbitControlsModule["OrbitControls"];
  GLTFLoader: GLTFLoaderModule["GLTFLoader"];
};

export type PreparedModel = {
  /** Centred on the origin, so every hero is framed by the same camera math. */
  root: ThreeNamespace.Group;
  extent: number;
};

export type HeroEngine = {
  canvas: HTMLCanvasElement;
  attach: (host: HTMLElement) => void;
  detach: (host: HTMLElement) => void;
  showModel: (model: PreparedModel) => void;
  setLabel: (hero: string, slug: string) => void;
};

/** One wheel notch spins the hero about a quarter turn before friction stops it. */
const WHEEL_TO_RADIANS = 0.0005;
const MAX_SPIN_PER_FRAME = 0.16;
const SPIN_FRICTION = 0.9;
const SPIN_EPSILON = 0.0004;
const WHEEL_LINE_PIXELS = 16;
const WHEEL_PAGE_PIXELS = 400;
/** A wheel gesture that is already scrolling the page keeps scrolling it. */
const PAGE_SCROLL_GRACE_MS = 250;

const modelUrl = (slug: string) => `/assets/heroes/models/${slug}/model.glb`;

export const heroSlugFromImage = (heroImage: string) =>
  heroImage.split("/").at(-1)?.replace(/\.[a-z0-9]+$/i, "") ?? "antimage";

const clamp = (value: number, limit: number) => Math.min(Math.max(value, -limit), limit);

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------------------
// Lazily loaded three.js. Kept behind dynamic imports so the library stays in
// its own chunk and never lands in the main client bundle.
// ---------------------------------------------------------------------------

let libsPromise: Promise<Libs> | null = null;

const loadLibs = (): Promise<Libs> =>
  (libsPromise ??= Promise.all([
    import("three"),
    import("three/addons/controls/OrbitControls.js"),
    import("three/addons/loaders/GLTFLoader.js"),
  ]).then(([THREE, controls, loaders]) => ({
    THREE,
    OrbitControls: controls.OrbitControls,
    GLTFLoader: loaders.GLTFLoader,
  })));

// ---------------------------------------------------------------------------
// Model cache. A hero is fetched and parsed once per page load; coming back to
// it later is a scene-graph swap rather than a download.
// ---------------------------------------------------------------------------

const modelPromises = new Map<string, Promise<PreparedModel>>();
const readyModels = new Map<string, PreparedModel>();

export const peekHeroModel = (slug: string) => readyModels.get(slug) ?? null;

export const loadHeroModel = (slug: string): Promise<PreparedModel> => {
  const cached = modelPromises.get(slug);
  if (cached) return cached;

  const pending = fetchHeroModel(slug);
  modelPromises.set(slug, pending);
  pending.then(
    (model) => readyModels.set(slug, model),
    // A failed load must not poison the cache — the next attempt refetches.
    () => modelPromises.delete(slug),
  );
  return pending;
};

const fetchHeroModel = async (slug: string): Promise<PreparedModel> => {
  const url = modelUrl(slug);
  const [{ THREE, GLTFLoader }, response] = await Promise.all([loadLibs(), fetch(url)]);
  if (!response.ok) throw new Error(`Model request failed: ${response.status}`);

  const data = await response.arrayBuffer();
  const gltf = await new GLTFLoader().parseAsync(data, url.replace(/[^/]+$/, ""));
  const root = gltf.scene;

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material: ThreeNamespace.Material) => {
      material.side = THREE.DoubleSide;
      if (material instanceof THREE.MeshStandardMaterial) {
        material.color.set(0xffffff);
        material.metalness = 0.04;
        material.roughness = 0.82;
        if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      }
      material.needsUpdate = true;
    });
  });

  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  root.position.sub(bounds.getCenter(new THREE.Vector3()));

  return { root, extent: Math.max(size.x, size.y, size.z, 1) };
};

// ---------------------------------------------------------------------------
// Idle prefetch for the heroes the reader has not reached yet.
// ---------------------------------------------------------------------------

const isMeteredConnection = () => {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return typeof connection.effectiveType === "string" && !connection.effectiveType.includes("4g");
};

const whenIdle = () =>
  new Promise<void>((resolve) => {
    if (typeof requestIdleCallback === "function") requestIdleCallback(() => resolve(), { timeout: 3000 });
    else setTimeout(resolve, 300);
  });

/**
 * Warms the model cache one hero at a time, in the order given, so the hero on
 * screen never competes with a prefetch for bandwidth. Returns a cancel function.
 */
export const preloadHeroModels = (slugs: readonly string[]) => {
  let cancelled = false;
  if (typeof window === "undefined" || isMeteredConnection()) return () => {};

  void (async () => {
    for (const slug of slugs) {
      if (cancelled) return;
      if (!peekHeroModel(slug)) await whenIdle();
      if (cancelled) return;
      await loadHeroModel(slug).catch(() => {});
    }
  })();

  return () => {
    cancelled = true;
  };
};

// ---------------------------------------------------------------------------
// One renderer for the whole page. A WebGL context per hero switch exhausts the
// browser context budget and eventually loses the canvas for good.
// ---------------------------------------------------------------------------

let enginePromise: Promise<HeroEngine> | null = null;
let readyEngine: HeroEngine | null = null;

export const peekHeroEngine = () => readyEngine;

export const getHeroEngine = (): Promise<HeroEngine> => {
  enginePromise ??= createEngine().then((engine) => {
    readyEngine = engine;
    return engine;
  });
  return enginePromise;
};

/** Called when the context is lost: the next attempt builds a fresh renderer. */
const retireEngine = () => {
  enginePromise = null;
  readyEngine = null;
};

const createEngine = async (): Promise<HeroEngine> => {
  const { THREE, OrbitControls } = await loadLibs();

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.setClearColor(0x000000, 0);

  const canvas = renderer.domElement;
  canvas.className = "hero-model-canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const tunedTextures = new WeakSet<ThreeNamespace.Texture>();

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xc8e3ff, 0x18231f, 2.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(4, 7, 6);
  const rimLight = new THREE.DirectionalLight(0x647dff, 2.5);
  rimLight.position.set(-5, 3, -4);
  scene.add(keyLight, rimLight);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  // The wheel spins the hero instead of dollying, so OrbitControls has to keep
  // its own wheel handler out of the way.
  controls.enableZoom = false;
  controls.rotateSpeed = 0.7;
  controls.minPolarAngle = Math.PI * 0.08;
  controls.maxPolarAngle = Math.PI * 0.92;

  let host: HTMLElement | null = null;
  let current: PreparedModel | null = null;
  let renderFrame = 0;
  let spinFrame = 0;
  let spinVelocity = 0;

  // Rendering is on demand: a still hero costs nothing, and every input path
  // coalesces into at most one draw per frame.
  const renderNow = () => {
    renderFrame = 0;
    renderer.render(scene, camera);
  };
  const requestRender = () => {
    if (renderFrame || !host) return;
    renderFrame = requestAnimationFrame(renderNow);
  };
  controls.addEventListener("change", requestRender);

  const stopSpin = () => {
    if (spinFrame) cancelAnimationFrame(spinFrame);
    spinFrame = 0;
    spinVelocity = 0;
  };
  // A drag takes over from any coasting spin.
  controls.addEventListener("start", stopSpin);

  const stepSpin = () => {
    spinFrame = 0;
    controls.rotateLeft(spinVelocity);
    controls.update();
    spinVelocity *= SPIN_FRICTION;
    if (Math.abs(spinVelocity) > SPIN_EPSILON) spinFrame = requestAnimationFrame(stepSpin);
    else spinVelocity = 0;
  };

  // Rolling the wheel over the hero spins it, but a gesture that is already
  // scrolling the page must not be hijacked mid-flick, or the model becomes a
  // scroll trap on narrow layouts where it spans the full width.
  let lastPageScroll = 0;
  const notePageScroll = () => {
    lastPageScroll = performance.now();
  };
  window.addEventListener("scroll", notePageScroll, { passive: true, capture: true });

  const handleWheel = (event: WheelEvent) => {
    // Ctrl/Cmd + wheel is the browser zoom gesture — never take it.
    if (event.ctrlKey || event.metaKey || !current) return;
    if (performance.now() - lastPageScroll < PAGE_SCROLL_GRACE_MS) return;
    const scale = event.deltaMode === 1 ? WHEEL_LINE_PIXELS : event.deltaMode === 2 ? WHEEL_PAGE_PIXELS : 1;
    const delta = (event.deltaY || event.deltaX) * scale;
    if (!delta) return;
    event.preventDefault();

    if (prefersReducedMotion()) {
      stopSpin();
      controls.rotateLeft(clamp(delta * WHEEL_TO_RADIANS * 4, MAX_SPIN_PER_FRAME * 4));
      controls.update();
      return;
    }
    spinVelocity = clamp(spinVelocity + delta * WHEEL_TO_RADIANS, MAX_SPIN_PER_FRAME);
    if (!spinFrame) spinFrame = requestAnimationFrame(stepSpin);
  };
  canvas.addEventListener("wheel", handleWheel, { passive: false });

  const handleKeyDown = (event: KeyboardEvent) => {
    const step = event.shiftKey ? 0.18 : 0.08;
    if (event.key === "ArrowLeft") controls.rotateLeft(step);
    else if (event.key === "ArrowRight") controls.rotateLeft(-step);
    else if (event.key === "ArrowUp") controls.rotateUp(step);
    else if (event.key === "ArrowDown") controls.rotateUp(-step);
    else return;
    event.preventDefault();
    stopSpin();
    controls.update();
  };
  canvas.addEventListener("keydown", handleKeyDown);

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stopSpin();
    if (renderFrame) cancelAnimationFrame(renderFrame);
    renderFrame = 0;
    retireEngine();
    window.removeEventListener("scroll", notePageScroll, { capture: true });
    // Freeing three's bookkeeping is deferred out of the event dispatch; the
    // cached models survive and re-upload themselves on the next renderer.
    setTimeout(() => renderer.dispose(), 0);
  });

  const resize = () => {
    if (!host) return;
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  };
  const resizeObserver = new ResizeObserver(resize);

  const tuneTextures = (root: ThreeNamespace.Group) => {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material: ThreeNamespace.Material) => {
        const map = (material as ThreeNamespace.MeshStandardMaterial).map;
        if (!map || tunedTextures.has(map)) return;
        tunedTextures.add(map);
        map.anisotropy = Math.min(maxAnisotropy, 4);
        map.needsUpdate = true;
      });
    });
  };

  const frameCamera = (extent: number) => {
    camera.near = extent / 100;
    camera.far = extent * 100;
    // Frame the whole model with margin: at a 32° vertical fov the full extent
    // needs ~1.75x distance, so start further back instead of cropping the head.
    camera.position.set(extent * 0.78, extent * 0.14, extent * 2.15);
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.minDistance = extent * 0.72;
    controls.maxDistance = extent * 3.2;
    controls.update();
  };

  return {
    canvas,
    attach: (nextHost) => {
      if (host === nextHost && canvas.parentElement === nextHost) return;
      if (host && host !== nextHost) resizeObserver.unobserve(host);
      host = nextHost;
      // replaceChildren also clears out the canvas of a retired engine, so a
      // context-loss recovery never stacks two canvases in the same stage.
      nextHost.replaceChildren(canvas);
      resizeObserver.observe(nextHost);
      resize();
    },
    detach: (prevHost) => {
      if (host !== prevHost) return;
      resizeObserver.unobserve(prevHost);
      stopSpin();
      if (renderFrame) cancelAnimationFrame(renderFrame);
      renderFrame = 0;
      canvas.remove();
      host = null;
    },
    showModel: (model) => {
      if (current === model) return;
      if (current) scene.remove(current.root);
      current = model;
      tuneTextures(model.root);
      scene.add(model.root);
      frameCamera(model.extent);
      requestRender();
    },
    setLabel: (hero, slug) => {
      canvas.setAttribute(
        "aria-label",
        `3D-модель героя ${hero}. Вращайте перетаскиванием, колёсиком мыши или клавишами со стрелками.`,
      );
      canvas.setAttribute("aria-describedby", `hero-model-help-${slug}`);
    },
  };
};
