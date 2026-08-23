type ThreeModule = typeof import("three");
type OrbitControls = InstanceType<(typeof import("three/addons/controls/OrbitControls.js"))["OrbitControls"]>;
type Group = InstanceType<ThreeModule["Group"]>;

export type HeroSceneOptions = {
  host: HTMLElement;
  hero: string;
  slug: string;
  signal: AbortSignal;
  onContextLost: () => void;
};

/** Wheel rotation feel: radians per pixel of wheel delta, and the easing per frame. */
const radiansPerWheelPixel = 0.0022;
const wheelEasing = 0.22;
/** One notch is ~120px; anything larger is a trackpad fling we clamp to stay controllable. */
const maxWheelPixelsPerEvent = 180;
const linePixels = 16;
const pagePixels = 400;
/** A page scroll this recent means the pointer just travelled over the model — don't hijack it. */
const scrollChainingWindowMs = 220;

function wheelPixels(event: WheelEvent): number {
  const raw = event.deltaMode === 1
    ? event.deltaY * linePixels
    : event.deltaMode === 2
      ? event.deltaY * pagePixels
      : event.deltaY;
  return Math.max(-maxWheelPixelsPerEvent, Math.min(maxWheelPixelsPerEvent, raw));
}

/**
 * Builds the WebGL stage for one hero and returns its disposer.
 *
 * Every resource is pushed on a stack as soon as it exists, so aborting mid-load (the
 * reader shuffled to another hero while the .glb was still downloading) still releases
 * the GL context instead of leaking it until the browser drops the oldest one.
 */
export async function createHeroScene({ host, hero, slug, signal, onContextLost }: HeroSceneOptions): Promise<() => void> {
  const disposers: Array<() => void> = [];
  const dispose = () => {
    while (disposers.length > 0) disposers.pop()?.();
  };

  try {
    const [THREE, { OrbitControls }, { GLTFLoader }, modelResponse] = await Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
      import("three/addons/loaders/GLTFLoader.js"),
      fetch(`/assets/heroes/models/${slug}/model.glb`, { signal }),
    ]);
    if (!modelResponse.ok) throw new Error(`Model request failed: ${modelResponse.status}`);
    const modelData = await modelResponse.arrayBuffer();
    signal.throwIfAborted();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    disposers.push(() => {
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.className = "hero-model-canvas";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `3D-модель героя ${hero}. Вращайте перетаскиванием, колёсиком мыши или клавишами со стрелками.`);
    canvas.setAttribute("aria-describedby", `hero-model-help-${slug}`);
    host.appendChild(canvas);

    scene.add(new THREE.HemisphereLight(0xc8e3ff, 0x18231f, 2.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x647dff, 2.5);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, canvas);
    disposers.push(() => controls.dispose());
    canvas.style.touchAction = "pan-y";
    controls.enableDamping = false;
    controls.enablePan = false;
    // Distance stays fixed: the wheel spins the model instead of zooming it.
    controls.enableZoom = false;
    controls.rotateSpeed = 0.7;
    controls.minPolarAngle = Math.PI * 0.08;
    controls.maxPolarAngle = Math.PI * 0.92;

    const render = () => renderer.render(scene, camera);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    disposers.push(() => resizeObserver.disconnect());

    const loader = new GLTFLoader();
    const model: Group = (await loader.parseAsync(modelData, window.location.href)).scene;
    disposers.push(() => disposeModel(THREE, model));
    signal.throwIfAborted();

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.side = THREE.DoubleSide;
        if (material instanceof THREE.MeshStandardMaterial) {
          material.color.set(0xffffff);
          material.metalness = 0.04;
          material.roughness = 0.82;
          if (material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace;
            material.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
          }
        }
        material.needsUpdate = true;
      });
    });

    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const extent = Math.max(size.x, size.y, size.z, 1);
    model.position.sub(center);
    scene.add(model);

    camera.near = extent / 100;
    camera.far = extent * 100;
    // Frame the whole model with margin: at a 32° vertical fov the full extent needs
    // ~1.75x distance, so start further back instead of cropping the head and feet.
    camera.position.set(extent * 0.78, extent * 0.14, extent * 2.15);
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.minDistance = extent * 0.72;
    controls.maxDistance = extent * 3.2;
    controls.update();

    disposers.push(attachWheelRotation(canvas, controls, render));
    disposers.push(attachKeyboardRotation(canvas, controls, render));

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    disposers.push(() => canvas.removeEventListener("webglcontextlost", handleContextLost));

    controls.addEventListener("change", render);
    disposers.push(() => controls.removeEventListener("change", render));

    resize();
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}

/**
 * Mouse wheel spins the hero around its vertical axis. The rotation is eased over a few
 * frames so a chunky wheel notch reads as a turn rather than a jump.
 *
 * Exported for tests: the wheel contract (how much a notch turns, when the page keeps its
 * scroll) is worth pinning down without a GPU.
 */
export function attachWheelRotation(canvas: HTMLCanvasElement, controls: OrbitControls, render: () => void): () => void {
  let pendingRotation = 0;
  let animationFrame = 0;
  let lastPageScrollAt = Number.NEGATIVE_INFINITY;

  const step = () => {
    const delta = Math.abs(pendingRotation) < 0.0004 ? pendingRotation : pendingRotation * wheelEasing;
    pendingRotation -= delta;
    controls.rotateLeft(delta);
    controls.update();
    render();
    animationFrame = pendingRotation === 0 ? 0 : requestAnimationFrame(step);
  };

  const handleWheel = (event: WheelEvent) => {
    // Ctrl/Cmd + wheel is the browser's own zoom gesture — leave it alone.
    if (event.ctrlKey || event.metaKey) return;
    // The pointer only crossed the model during a page scroll; keep scrolling.
    if (performance.now() - lastPageScrollAt < scrollChainingWindowMs) return;

    event.preventDefault();
    pendingRotation += wheelPixels(event) * radiansPerWheelPixel;
    if (animationFrame === 0) animationFrame = requestAnimationFrame(step);
  };

  const handlePageScroll = () => {
    lastPageScrollAt = performance.now();
  };

  canvas.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("scroll", handlePageScroll, { passive: true });

  return () => {
    canvas.removeEventListener("wheel", handleWheel);
    window.removeEventListener("scroll", handlePageScroll);
    if (animationFrame !== 0) cancelAnimationFrame(animationFrame);
  };
}

/** Arrow keys give the same orbit to keyboard users; Shift turns further per press. */
function attachKeyboardRotation(canvas: HTMLCanvasElement, controls: OrbitControls, render: () => void): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    const step = event.shiftKey ? 0.18 : 0.08;
    if (event.key === "ArrowLeft") controls.rotateLeft(step);
    else if (event.key === "ArrowRight") controls.rotateLeft(-step);
    else if (event.key === "ArrowUp") controls.rotateUp(step);
    else if (event.key === "ArrowDown") controls.rotateUp(-step);
    else return;
    event.preventDefault();
    controls.update();
    render();
  };

  canvas.addEventListener("keydown", handleKeyDown);
  return () => canvas.removeEventListener("keydown", handleKeyDown);
}

function disposeModel(THREE: ThreeModule, target: Group): void {
  const disposedTextures = new Set<InstanceType<ThreeModule["Texture"]>>();
  target.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (!(value instanceof THREE.Texture) || disposedTextures.has(value)) return;
        disposedTextures.add(value);
        value.dispose();
      });
      material.dispose();
    });
  });
  target.removeFromParent();
}
