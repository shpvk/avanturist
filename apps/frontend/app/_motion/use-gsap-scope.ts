"use client";

import { gsap } from "gsap";
import { useRef, type DependencyList } from "react";
import { useMotion } from "./motion-context";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

export function useGsapScope<T extends HTMLElement>(
  setup: (scope: T) => void,
  deps: DependencyList = [],
) {
  const scope = useRef<T | null>(null);
  const { reducedMotion } = useMotion();

  useIsomorphicLayoutEffect(() => {
    const element = scope.current;
    if (reducedMotion || !element) return;

    const context = gsap.context(() => setup(element), element);
    return () => context.revert();
  }, [reducedMotion, ...deps]);

  return scope;
}
