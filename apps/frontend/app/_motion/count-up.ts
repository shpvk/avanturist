"use client";

import { gsap } from "gsap";
import { ease } from "./tokens";

export function countUpTargets(scope: ParentNode = document): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>("[data-count]"));
}

export function createCountUp(element: HTMLElement): gsap.core.Tween {
  const total = Number(element.dataset.count);
  const counter = { value: 0 };

  return gsap.to(counter, {
    value: total,
    duration: 1.4,
    ease: ease.outExpo,
    paused: true,
    onStart: () => {
      element.textContent = "0";
    },
    onUpdate: () => {
      element.textContent = String(Math.round(counter.value));
    },
    onComplete: () => {
      element.textContent = String(total);
    },
  });
}
