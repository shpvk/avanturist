"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getHeroEngine, loadHeroModel, peekHeroEngine, peekHeroModel } from "./hero-model-engine";

type ViewerStatus = "loading" | "ready" | "fallback";

// One automatic rebuild after a lost WebGL context; past that the poster stays.
const maxRecoveryAttempts = 1;

export default function HeroModelViewer({ hero, slug }: { hero: string; slug: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Remounting the viewer (a trip through "Все билды" and back) skips the poster
  // entirely when the engine and the model are already cached.
  const [status, setStatus] = useState<ViewerStatus>(() =>
    peekHeroEngine() && peekHeroModel(slug) ? "ready" : "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const [shownSlug, setShownSlug] = useState(slug);
  const poster = `/assets/heroes/renders/${slug}.webp`;

  // Switching heroes must not flash the poster when the model is already cached,
  // so the status is adjusted during render instead of in an effect.
  if (shownSlug !== slug) {
    setShownSlug(slug);
    setAttempt(0);
    setStatus(peekHeroEngine() && peekHeroModel(slug) ? "ready" : "loading");
  }

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let attached: ReturnType<typeof peekHeroEngine> = null;

    const handleContextLost = () => {
      if (disposed) return;
      setStatus("fallback");
      setAttempt((current) => (current < maxRecoveryAttempts ? current + 1 : current));
    };

    const show = async () => {
      const [engine, model] = await Promise.all([getHeroEngine(), loadHeroModel(slug)]);
      if (disposed) return;
      attached = engine;
      engine.setLabel(hero, slug);
      engine.attach(host);
      engine.showModel(model);
      engine.canvas.addEventListener("webglcontextlost", handleContextLost);
      setStatus("ready");
    };

    void show().catch(() => {
      if (!disposed) setStatus("fallback");
    });

    return () => {
      disposed = true;
      if (!attached) return;
      attached.canvas.removeEventListener("webglcontextlost", handleContextLost);
      attached.detach(host);
    };
    // `attempt` re-runs the effect after a context loss, with a fresh engine.
  }, [hero, slug, attempt]);

  return (
    <div className={`hero-viewer ${status}`} aria-label={`Интерактивная 3D-модель героя ${hero}`}>
      <div ref={hostRef} className="hero-viewer-stage" />
      {/* The poster stays mounted and fades out, so a hero switch never blinks. */}
      <Image className="hero-model hero-model-poster" src={poster} alt={hero} width={1080} height={1080} priority unoptimized />
      {status === "loading" && <span className="hero-model-loading" role="status">Загружаем 3D-модель…</span>}
      {status === "fallback" && <span className="hero-model-loading" role="status">3D недоступно — показываем постер</span>}
      <span id={`hero-model-help-${slug}`} className="sr-only">
        Перетаскивайте модель мышью, крутите колёсиком или используйте клавиши со стрелками, чтобы вращать героя. Страница продолжает прокручиваться свайпом и колесом вне модели.
      </span>
    </div>
  );
}
