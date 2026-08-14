"use client";

import { useEffect, useRef, useState } from "react";

type ViewerStatus = "loading" | "ready" | "fallback";

export default function HeroModelViewer({ hero, slug }: { hero: string; slug: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const poster = `/assets/heroes/renders/${slug}.png`;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup = () => {};

    const initialize = async () => {
      const [THREE, { OrbitControls }, { GLTFLoader }] = await Promise.all([
        import("three"),
        import("three/addons/controls/OrbitControls.js"),
        import("three/addons/loaders/GLTFLoader.js"),
      ]);
      if (disposed) return;

      let animationFrame = 0;
      let model: InstanceType<typeof THREE.Group> | null = null;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.className = "hero-model-canvas";
      host.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xc8e3ff, 0x18231f, 2.4));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
      keyLight.position.set(4, 7, 6);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x647dff, 2.5);
      rimLight.position.set(-5, 3, -4);
      scene.add(rimLight);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.rotateSpeed = 0.7;
      controls.minPolarAngle = Math.PI * 0.08;
      controls.maxPolarAngle = Math.PI * 0.92;

      let wheelVelocity = 0;
      const rotateWithWheel = (event: WheelEvent) => {
        event.preventDefault();
        const normalizedDelta = THREE.MathUtils.clamp(event.deltaY, -120, 120);
        wheelVelocity = THREE.MathUtils.clamp(wheelVelocity + normalizedDelta * 0.00032, -0.065, 0.065);
      };
      const stopWheelInertia = () => {
        wheelVelocity = 0;
      };
      renderer.domElement.addEventListener("wheel", rotateWithWheel, { passive: false });
      renderer.domElement.addEventListener("pointerdown", stopWheelInertia);

      const resize = () => {
        const width = Math.max(host.clientWidth, 1);
        const height = Math.max(host.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      const disposeModel = (target: InstanceType<typeof THREE.Group>) => {
        const disposedTextures = new Set<InstanceType<typeof THREE.Texture>>();
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
      };

      cleanup = () => {
        window.cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        renderer.domElement.removeEventListener("wheel", rotateWithWheel);
        renderer.domElement.removeEventListener("pointerdown", stopWheelInertia);
        controls.dispose();
        if (model) disposeModel(model);
        renderer.dispose();
        renderer.domElement.remove();
      };

      const loader = new GLTFLoader();
      loader.load(
        `/assets/heroes/models/${slug}/model.glb`,
        (gltf) => {
          const loadedModel = gltf.scene;
          if (disposed) {
            disposeModel(loadedModel);
            return;
          }

          model = loadedModel;
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
                  material.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
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
          camera.position.set(extent * 0.72, extent * 0.16, extent * 1.55);
          camera.updateProjectionMatrix();
          controls.target.set(0, 0, 0);
          controls.minDistance = extent * 0.72;
          controls.maxDistance = extent * 3.2;
          controls.update();
          setStatus("ready");
        },
        undefined,
        () => {
          if (!disposed) setStatus("fallback");
        },
      );

      let previousFrameTime = performance.now();
      const render = (frameTime: number) => {
        const frameFactor = THREE.MathUtils.clamp((frameTime - previousFrameTime) / (1000 / 60), 0.25, 2.5);
        previousFrameTime = frameTime;
        if (Math.abs(wheelVelocity) > 0.00002) {
          controls.rotateLeft(wheelVelocity * frameFactor);
          wheelVelocity *= Math.pow(0.955, frameFactor);
        } else {
          wheelVelocity = 0;
        }
        controls.update();
        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(render);
      };
      animationFrame = window.requestAnimationFrame(render);
    };

    void initialize().catch(() => {
      if (!disposed) setStatus("fallback");
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [slug]);

  return (
    <div className={`hero-viewer ${status}`} aria-label={`Интерактивная 3D-модель героя ${hero}`}>
      <div ref={hostRef} className="hero-viewer-stage" />
      {status !== "ready" && (
        <img className="hero-model hero-model-poster" src={poster} alt={hero} width={1440} height={1440} />
      )}
      {status === "loading" && <span className="hero-model-loading">Загружаем 3D-модель…</span>}
    </div>
  );
}
