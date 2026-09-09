"use client";

import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export function splitIntoMaskedWords(element: HTMLElement): SplitText {
  return SplitText.create(element, {
    type: "lines,words",
    mask: "lines",
    linesClass: "split-line",
    wordsClass: "split-word",
  });
}
