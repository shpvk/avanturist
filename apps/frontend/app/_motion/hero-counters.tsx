"use client";

import { countUpTargets, createCountUp } from "./count-up";
import { whenIntroDone } from "./intro-progress";
import { useMotion } from "./motion-context";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

export function HeroCounters() {
  const { reducedMotion } = useMotion();

  useIsomorphicLayoutEffect(() => {
    if (reducedMotion) return;

    const tweens = countUpTargets(document).map(createCountUp);
    if (tweens.length === 0) return;

    const cancel = whenIntroDone(() => {
      tweens.forEach((tween) => tween.play());
    });

    return () => {
      cancel();
      tweens.forEach((tween) => tween.kill());
    };
  }, [reducedMotion]);

  return null;
}
