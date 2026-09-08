"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { useMotion } from "./motion-context";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

const secondsPerItem = 4.2;

export function Marquee({ items }: { items: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMotion();

  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    if (reducedMotion || !track || items.length === 0) return;

    const context = gsap.context(() => {
      const loop = gsap.to(track, {
        xPercent: -50,
        duration: items.length * secondsPerItem,
        ease: "none",
        repeat: -1,
      });

      let direction = 1;
      const trigger = ScrollTrigger.create({
        onUpdate: (self) => {
          if (self.direction === direction) return;
          direction = self.direction;
          gsap.to(loop, {
            timeScale: direction,
            duration: 0.45,
            ease: "power2.out",
            overwrite: true,
          });
        },
      });

      return () => {
        trigger.kill();
        loop.kill();
      };
    }, track);

    return () => context.revert();
  }, [reducedMotion, items.length]);

  if (items.length === 0) return null;

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track" ref={trackRef}>
        {[0, 1].map((copy) => (
          <ul className="marquee-row" key={copy}>
            {items.map((item, index) => (
              <li key={`${copy}-${index}`}>{item}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
