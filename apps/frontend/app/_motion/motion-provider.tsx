"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { MotionContext, motionController } from "./motion-context";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function readReducedMotionOnServer() {
  return true;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    readReducedMotion,
    readReducedMotionOnServer,
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("motion-ready");

    if (reducedMotion) {
      return () => root.classList.remove("motion-ready");
    }

    const lenis = new Lenis({ duration: 1.1, touchMultiplier: 1.4, autoRaf: false });
    const advance = (time: number) => lenis.raf(time * 1000);

    motionController.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(advance);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(advance);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      motionController.lenis = null;
      root.classList.remove("motion-ready");
    };
  }, [reducedMotion]);

  const value = useMemo(() => ({ reducedMotion }), [reducedMotion]);

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
