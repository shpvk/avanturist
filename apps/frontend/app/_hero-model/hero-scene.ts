type ThreeModule = typeof import("three");
type OrbitControls = InstanceType<(typeof import("three/addons/controls/OrbitControls.js"))["OrbitControls"]>;
type Group = InstanceType<ThreeModule["Group"]>;

export type FrameScheduler = {
  add: (callback: () => void) => void;
  remove: (callback: () => void) => void;
};

export type HeroSceneOptions = {
  host: HTMLElement;
  hero: string;
  slug: string;
  signal: AbortSignal;
  onContextLost: () => void;
  reducedMotion?: boolean;
  scheduler?: FrameScheduler;
};

export const radiansPerWheelPixel = 0.007;
const wheelEasing = 0.32;
const maxWheelPixelsPerEvent = 180;
const linePixels = 16;
const pagePixels = 400;
const scrollChainingWindowMs = 220;
const pointerEasing = 0.06;
const pointerReach = 1.6;
const parallaxYaw = 0.16;
const parallaxPitch = 0.07;

function wheelPixels(event: WheelEvent): number {
  const raw = event.deltaMode === 1
    ? event.deltaY * linePixels
    : event.deltaMode === 2
      ? event.deltaY * pagePixels
      : event.deltaY;
  return Math.max(-maxWheelPixelsPerEvent, Math.min(maxWheelPixelsPerEvent, raw));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function animationFrameScheduler(): FrameScheduler {
  const callbacks = new Set<() => void>();
  let handle = 0;

  const step = () => {
    callbacks.forEach((callback) => callback());
    handle = callbacks.size === 0 ? 0 : requestAnimationFrame(step);
  };

  return {
    add: (callback) => {
      callbacks.add(callback);
      if (handle === 0) handle = requestAnimationFrame(step);
    },
    remove: (callback) => {
      callbacks.delete(callback);
      if (callbacks.size === 0 && handle !== 0) {
        cancelAnimationFrame(handle);
        handle = 0;
      }
    },
  };
}

export async function createHeroScene({
  host,
  hero,
  slug,
  signal,
  onContextLost,
  reducedMotion = false,
  scheduler,
}: HeroSceneOptions): Promise<() => void> {
  const disposers: Array<() => void> = [];
  const dispose = () => {
    while (disposers.length > 0) disposers.pop()?.();
  };

  try {
    const coarsePointer = window.matchMedia("(hover: none)").matches;
    const wantsBloom = !reducedMotion && !coarsePointer && window.innerWidth > 900;

    const [THREE, { OrbitControls }, { GLTFLoader }, { MeshoptDecoder }, { createHeroBackground }, modelResponse] = await Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/libs/meshopt_decoder.module.js"),
      import("./hero-background"),
      fetch(`/assets/heroes/models/${slug}/model.glb`, { signal }),
    ]);
    if (!modelResponse.ok) throw new Error(`Model request failed: ${modelResponse.status}`);
    const modelData = await modelResponse.arrayBuffer();
    signal.throwIfAborted();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !wantsBloom });
    disposers.push(() => {
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    });

    const pixelRatio = Math.min(window.devicePixelRatio, coarsePointer ? 1 : 1.35);
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.className = "hero-model-canvas";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `3D model of ${hero}. Rotate it by dragging, with the mouse wheel or with the arrow keys.`);
    canvas.setAttribute("aria-describedby", `hero-model-help-${slug}`);
    host.appendChild(canvas);

    const background = createHeroBackground(THREE, coarsePointer ? 0.6 : 1);
    scene.add(background.mesh);
    disposers.push(background.dispose);

    let composer: InstanceType<(typeof import("three/addons/postprocessing/EffectComposer.js"))["EffectComposer"]> | null = null;
    if (wantsBloom) {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
        import("three/addons/postprocessing/EffectComposer.js"),
        import("three/addons/postprocessing/RenderPass.js"),
        import("three/addons/postprocessing/UnrealBloomPass.js"),
        import("three/addons/postprocessing/OutputPass.js"),
      ]);
      signal.throwIfAborted();

      const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.8, 0.9);
      composer = new EffectComposer(renderer);
      composer.setPixelRatio(pixelRatio);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
      const activeComposer = composer;
      disposers.push(() => {
        bloom.dispose();
        activeComposer.dispose();
      });
    }

    scene.add(new THREE.HemisphereLight(0xd8f4e2, 0x1a2318, 2.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x5df78f, 2.5);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, canvas);
    disposers.push(() => controls.dispose());
    canvas.style.touchAction = "pan-y";
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.rotateSpeed = 0.7;
    controls.minPolarAngle = Math.PI * 0.08;
    controls.maxPolarAngle = Math.PI * 0.92;

    const render = () => {
      if (composer) composer.render();
      else renderer.render(scene, camera);
    };

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      composer?.setSize(width, height);
      background.uniforms.uResolution.value.set(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    disposers.push(() => resizeObserver.disconnect());

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const model: Group = (await loader.parseAsync(modelData, window.location.href)).scene;
    disposers.push(() => disposeModel(THREE, model));
    signal.throwIfAborted();

    let litMaterials = 0;
    let texturedMaterials = 0;
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.side = THREE.DoubleSide;
        if (material instanceof THREE.MeshStandardMaterial) {
          litMaterials += 1;
          material.color.set(0xffffff);
          material.metalness = 0.04;
          material.roughness = 0.82;
          if (material.map) {
            texturedMaterials += 1;
            material.map.colorSpace = THREE.SRGBColorSpace;
            material.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
          }
        }
        material.needsUpdate = true;
      });
    });

    if (litMaterials > 0 && texturedMaterials === 0) throw new Error("Hero model textures failed to load");

    dropUnposedProps(THREE, model);

    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const extent = Math.max(size.x, size.y, size.z, 1);
    model.position.sub(center);

    const pivot = new THREE.Group();
    pivot.add(model);
    scene.add(pivot);
    disposers.push(() => pivot.removeFromParent());

    camera.near = extent / 100;
    camera.far = extent * 100;
    camera.position.set(extent * 0.42, extent * 0.1, extent * 1.85);
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

    if (reducedMotion) {
      controls.addEventListener("change", render);
      disposers.push(() => controls.removeEventListener("change", render));
      resize();
      return dispose;
    }

    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    const handlePointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerTarget.x = clamp(((event.clientX - (rect.left + rect.width / 2)) / rect.width) * 2, -pointerReach, pointerReach);
      pointerTarget.y = clamp(((event.clientY - (rect.top + rect.height / 2)) / rect.height) * 2, -pointerReach, pointerReach);
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    disposers.push(() => window.removeEventListener("pointermove", handlePointerMove));

    let onScreen = true;
    const visibility = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { rootMargin: "15% 0px" },
    );
    visibility.observe(host);
    disposers.push(() => visibility.disconnect());

    const clock = new THREE.Clock();
    const heroProgress = () => {
      const rect = host.getBoundingClientRect();
      return clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
    };

    const frame = () => {
      const elapsed = clock.getElapsedTime();
      if (!onScreen) return;

      pointer.x += (pointerTarget.x - pointer.x) * pointerEasing;
      pointer.y += (pointerTarget.y - pointer.y) * pointerEasing;
      const progress = heroProgress();

      background.uniforms.uTime.value = elapsed;
      background.uniforms.uPointer.value.set(pointer.x, -pointer.y);
      background.uniforms.uScroll.value = progress;

      pivot.rotation.y = pointer.x * parallaxYaw;
      pivot.rotation.x = pointer.y * parallaxPitch;
      pivot.position.y = -progress * extent * 0.35;
      pivot.position.z = -progress * extent * 0.5;

      controls.update();
      render();
    };

    const frames = scheduler ?? animationFrameScheduler();
    frames.add(frame);
    disposers.push(() => frames.remove(frame));

    resize();
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}

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
    if (event.ctrlKey || event.metaKey) return;
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

const unposedPropName = /_(weapon|offhand)$/;

export function dropUnposedProps(THREE: ThreeModule, model: Group): void {
  const props: Array<InstanceType<ThreeModule["Mesh"]>> = [];
  model.traverse((object) => {
    if (object instanceof THREE.Mesh && unposedPropName.test(object.name)) props.push(object);
  });
  const disposedTextures = new Set<InstanceType<ThreeModule["Texture"]>>();
  props.forEach((prop) => {
    prop.removeFromParent();
    disposeMesh(THREE, prop, disposedTextures);
  });
}

function disposeModel(THREE: ThreeModule, target: Group): void {
  const disposedTextures = new Set<InstanceType<ThreeModule["Texture"]>>();
  target.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    disposeMesh(THREE, object, disposedTextures);
  });
  target.removeFromParent();
}

function disposeMesh(
  THREE: ThreeModule,
  mesh: InstanceType<ThreeModule["Mesh"]>,
  disposedTextures: Set<InstanceType<ThreeModule["Texture"]>>,
): void {
  mesh.geometry.dispose();
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  materials.forEach((material) => {
    Object.values(material).forEach((value) => {
      if (!(value instanceof THREE.Texture) || disposedTextures.has(value)) return;
      disposedTextures.add(value);
      value.dispose();
    });
    material.dispose();
  });
}
