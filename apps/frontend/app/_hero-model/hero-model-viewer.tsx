"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { markIntroMilestone } from "../_motion/intro-progress";
import { useMotion } from "../_motion/motion-context";
import { createHeroScene, type FrameScheduler } from "./hero-scene";

const gsapScheduler: FrameScheduler = {
  add: (callback) => gsap.ticker.add(callback),
  remove: (callback) => gsap.ticker.remove(callback),
};

type ViewerStatus = "loading" | "ready" | "fallback";

export default function HeroModelViewer({ hero, slug, portrait }: { hero: string; slug: string; portrait?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMotion();
  const [status, setStatus] = useState<ViewerStatus>("loading");
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
      reducedMotion,
      scheduler: gsapScheduler,
    }).then(
      (dispose) => {
        if (abortController.signal.aborted) {
          dispose();
          return;
        }
        disposeScene = dispose;
        markIntroMilestone("hero");
        setStatus("ready");
      },
      () => {
        markIntroMilestone("hero");
        if (!abortController.signal.aborted) setStatus("fallback");
      },
    );

    return () => {
      abortController.abort();
      disposeScene?.();
    };
  }, [hero, slug, reducedMotion]);

  return (
    <div className={`hero-viewer ${status}`} aria-label={`Interactive 3D model of ${hero}`}>
      <div ref={hostRef} className="hero-viewer-stage" />
      {status === "fallback" && (
        <Image className="hero-model hero-model-poster" src={poster} alt={hero} width={1080} height={1080} priority unoptimized onError={() => { if (portrait && poster !== portrait) setPoster(portrait); }} />
      )}
      {status === "loading" && <span className="hero-model-loading" role="status">Loading the 3D model…</span>}
      {status === "fallback" && <span className="hero-model-loading" role="status">3D unavailable — showing a still</span>}
      <span id={`hero-model-help-${slug}`} className="sr-only">Drag the model with the mouse, spin it with the wheel or use the arrow keys.</span>
    </div>
  );
}
