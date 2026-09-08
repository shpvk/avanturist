"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./motion-context";
import { duration, ease, shift, stagger } from "./tokens";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

export function RevealTargets() {
  const { reducedMotion } = useMotion();

  useIsomorphicLayoutEffect(() => {
    if (reducedMotion) return;

    const context = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>(".reveal");
      if (targets.length === 0) return;

      gsap.set(targets, { opacity: 0, y: shift.reveal });

      ScrollTrigger.batch(targets, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: duration.scene,
            ease: ease.outExpo,
            stagger: stagger.tight,
            overwrite: true,
          }),
      });
    });

    return () => context.revert();
  }, [reducedMotion]);

  return null;
}
