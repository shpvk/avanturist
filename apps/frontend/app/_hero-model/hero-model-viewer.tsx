"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createHeroScene } from "./hero-scene";

type ViewerStatus = "loading" | "ready" | "fallback";

/**
 * Show the loading indicator until the WebGL scene is ready. The static poster has
 * a different pose, so reserve it for failures (no WebGL, missing model, lost context)
 * instead of flashing it while the model loads.
 */
export default function HeroModelViewer({ hero, slug, portrait }: { hero: string; slug: string; portrait?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  // Not every hero in the API catalog has a pre-rendered poster; the portrait covers the rest.
  const [poster, setPoster] = useState(`/assets/heroes/renders/${slug}.webp`);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const abortController = new AbortController();
    let disposeScene: (() => void) | null = null;
    setStatus("loading");

    createHeroScene({
      host,
      hero,
      slug,
      signal: abortController.signal,
      onContextLost: () => setStatus("fallback"),
    }).then(
      (dispose) => {
        // The reader moved on while the scene was still being built.
        if (abortController.signal.aborted) {
          dispose();
          return;
        }
        disposeScene = dispose;
        setStatus("ready");
      },
      () => {
        if (!abortController.signal.aborted) setStatus("fallback");
      },
    );

    return () => {
      abortController.abort();
      disposeScene?.();
    };
  }, [hero, slug]);

  return (
    <div className={`hero-viewer ${status}`} aria-label={`Интерактивная 3D-модель героя ${hero}`}>
      <div ref={hostRef} className="hero-viewer-stage" />
      {status === "fallback" && (
        <Image className="hero-model hero-model-poster" src={poster} alt={hero} width={1080} height={1080} priority unoptimized onError={() => { if (portrait && poster !== portrait) setPoster(portrait); }} />
      )}
      {status === "loading" && <span className="hero-model-loading" role="status">Загружаем 3D-модель…</span>}
      {status === "fallback" && <span className="hero-model-loading" role="status">3D недоступно — показываем постер</span>}
      <span id={`hero-model-help-${slug}`} className="sr-only">Перетаскивайте модель мышью, крутите её колёсиком мыши или используйте клавиши со стрелками.</span>
    </div>
  );
}
