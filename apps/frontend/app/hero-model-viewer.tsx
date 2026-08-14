"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type ViewerStatus = "loading" | "ready" | "fallback";

export default function HeroModelViewer({ hero, slug }: { hero: string; slug: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const poster = `/assets/heroes/renders/${slug}.webp`;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const abortController = new AbortController();
    let disposed = false;
    let cleanup = () => {};

    const initialize = async () => {
      const [THREE, { OrbitControls }, { GLTFLoader }, modelResponse] = await Promise.all([
        import("three"),
        import("three/addons/controls/OrbitControls.js"),
        import("three/addons/loaders/GLTFLoader.js"),
        fetch(`/assets/heroes/models/${slug}/model.glb`, { signal: abortController.signal }),
      ]);
      if (!modelResponse.ok) throw new Error(`Model request failed: ${modelResponse.status}`);
      const modelData = await modelResponse.arrayBuffer();
      if (disposed) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.className = "hero-model-canvas";
      renderer.domElement.tabIndex = 0;
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.setAttribute("aria-label", `3D-модель героя ${hero}. Вращайте перетаскиванием или клавишами со стрелками.`);
      renderer.domElement.setAttribute("aria-describedby", `hero-model-help-${slug}`);
      host.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xc8e3ff, 0x18231f, 2.4));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
      keyLight.position.set(4, 7, 6);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x647dff, 2.5);
      rimLight.position.set(-5, 3, -4);
      scene.add(rimLight);

      const controls = new OrbitControls(camera, renderer.domElement);
      renderer.domElement.style.touchAction = "pan-y";
      controls.enableDamping = false;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.rotateSpeed = 0.7;
      controls.minPolarAngle = Math.PI * 0.08;
      controls.maxPolarAngle = Math.PI * 0.92;

      const render = () => {
        renderer.render(scene, camera);
      };

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

      const loader = new GLTFLoader();
      const gltf = await loader.parseAsync(modelData, window.location.href);
      const model = gltf.scene;
      if (disposed) {
        disposeModel(model);
        return;
      }

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
      camera.position.set(extent * 0.72, extent * 0.16, extent * 1.55);
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.minDistance = extent * 0.72;
      controls.maxDistance = extent * 3.2;
      controls.update();

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
      const handleContextLost = (event: Event) => {
        event.preventDefault();
        if (!disposed) setStatus("fallback");
      };
      controls.addEventListener("change", render);
      renderer.domElement.addEventListener("keydown", handleKeyDown);
      renderer.domElement.addEventListener("webglcontextlost", handleContextLost);
      resize();
      setStatus("ready");

      cleanup = () => {
        resizeObserver.disconnect();
        controls.removeEventListener("change", render);
        renderer.domElement.removeEventListener("keydown", handleKeyDown);
        renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
        controls.dispose();
        disposeModel(model);
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    void initialize().catch((error: unknown) => {
      if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) setStatus("fallback");
    });

    return () => {
      disposed = true;
      abortController.abort();
      cleanup();
    };
  }, [hero, slug]);

  return (
    <div className={`hero-viewer ${status}`} aria-label={`Интерактивная 3D-модель героя ${hero}`}>
      <div ref={hostRef} className="hero-viewer-stage" />
      {status !== "ready" && (
        <Image className="hero-model hero-model-poster" src={poster} alt={hero} width={1080} height={1080} priority unoptimized />
      )}
      {status === "loading" && <span className="hero-model-loading" role="status">Загружаем 3D-модель…</span>}
      {status === "fallback" && <span className="hero-model-loading" role="status">3D недоступно — показываем постер</span>}
      <span id={`hero-model-help-${slug}`} className="sr-only">Перетаскивайте модель мышью или используйте клавиши со стрелками. Прокрутка страницы остаётся доступной.</span>
    </div>
  );
}
