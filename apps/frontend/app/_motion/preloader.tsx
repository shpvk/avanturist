"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { motionController, useMotion } from "./motion-context";
import { claimIntro, introComplete, introProgress, markIntroMilestone, releaseIntro } from "./intro-progress";
import { splitIntoMaskedWords } from "./split-lines";
import { duration, ease, stagger } from "./tokens";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

const ARMED_CLASS = "intro-armed";
const SEEN_KEY = "bv-intro-seen";
const CREEP_CEILING = 0.94;
const CREEP_HALF_LIFE = 1.7;
const HARD_CEILING_MS = 6000;

export const introBootstrapScript = `(function(){try{var r=document.documentElement;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(sessionStorage.getItem("${SEEN_KEY}")==="1")return;r.classList.add("${ARMED_CLASS}");if("scrollRestoration" in history)history.scrollRestoration="manual";window.scrollTo(0,0)}catch(e){}})()`;

let armedAtLoad: boolean | null = null;

function introWasArmed(): boolean {
  if (armedAtLoad === null) {
    armedAtLoad = document.documentElement.classList.contains(ARMED_CLASS);
  }
  return armedAtLoad;
}

export function Preloader() {
  const { reducedMotion } = useMotion();
  const curtainRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const curtain = curtainRef.current;
    const body = bodyRef.current;
    const count = countRef.current;
    const bar = barRef.current;

    if (reducedMotion || !curtain || !body || !count || !bar) return;
    if (!introWasArmed()) return;

    const root = document.documentElement;
    root.classList.add(ARMED_CLASS);

    claimIntro();

    const release = () => {
      root.classList.remove(ARMED_CLASS);
      motionController.lenis?.start();
      ScrollTrigger.refresh();
      releaseIntro();
    };

    const context = gsap.context(() => {
      const heroCopy = gsap.utils.toArray<HTMLElement>(".landing-hero-copy > *", document);
      const heroStage = gsap.utils.toArray<HTMLElement>(".landing-hero-stage", document);
      const title = document.querySelector<HTMLElement>(".landing-title");
      const supporting = heroCopy.filter((element) => element !== title);

      document.fonts.ready.then(() => markIntroMilestone("fonts"));
      const giveUp = window.setTimeout(() => {
        markIntroMilestone("fonts");
        markIntroMilestone("hero");
      }, HARD_CEILING_MS);

      let shown = 0;
      let elapsed = 0;
      let leaving = false;

      const paint = (value: number) => {
        const percent = Math.round(value * 100);
        count.textContent = percent === 100 ? "100" : String(percent).padStart(2, "0");
        curtain.setAttribute("aria-valuenow", String(percent));
        gsap.set(bar, { scaleX: value });
      };

      const tick = (_time: number, delta: number) => {
        if (leaving) return;
        elapsed += delta / 1000;

        const creep = CREEP_CEILING * (1 - Math.exp(-elapsed / CREEP_HALF_LIFE));
        const target = introComplete() ? 1 : Math.max(creep, introProgress() * 0.9);
        shown += (target - shown) * 0.12;
        paint(shown);

        if (!introComplete() || shown < 0.995) return;

        leaving = true;
        gsap.ticker.remove(tick);
        paint(1);

        const split = title ? splitIntoMaskedWords(title) : null;

        gsap
          .timeline({
            onComplete: () => {
              split?.revert();
              release();
              try {
                sessionStorage.setItem(SEEN_KEY, "1");
              } catch {
                armedAtLoad = false;
              }
            },
          })
          .to(body, { autoAlpha: 0, duration: duration.slow, ease: ease.base })
          .to(curtain, {
            scaleY: 0,
            transformOrigin: "top center",
            duration: duration.epic,
            ease: ease.inOutQuint,
          })
          .from(
            split ? split.words : [],
            { yPercent: 116, duration: 1.15, ease: ease.outExpo, stagger: 0.055 },
            "-=1.2",
          )
          .from(
            supporting,
            {
              y: 44,
              autoAlpha: 0,
              duration: duration.scene,
              ease: ease.outExpo,
              stagger: stagger.loose,
            },
            "-=0.9",
          )
          .from(
            heroStage,
            { y: 30, scale: 0.97, autoAlpha: 0, duration: 1.2, ease: ease.outExpo },
            "<0.08",
          );
      };

      motionController.lenis?.stop();
      paint(0);
      gsap.ticker.add(tick);

      return () => {
        window.clearTimeout(giveUp);
        gsap.ticker.remove(tick);
      };
    }, curtain);

    return () => {
      context.revert();
      release();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={curtainRef}
      className="intro"
      role="progressbar"
      aria-label="Loading BuildVerdict"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <div ref={bodyRef} className="intro-body">
        <span className="label intro-label">Stocking the shop</span>
        <span className="intro-word">buildverdict</span>
        <span className="intro-count" ref={countRef}>00</span>
        <span className="intro-track">
          <span className="intro-bar" ref={barRef} />
        </span>
      </div>
    </div>
  );
}
