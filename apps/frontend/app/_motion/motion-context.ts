"use client";

import { createContext, useContext } from "react";
import type Lenis from "lenis";

export type MotionController = {
  lenis: Lenis | null;
};

export const motionController: MotionController = { lenis: null };

export type MotionState = {
  reducedMotion: boolean;
};

export const MotionContext = createContext<MotionState>({ reducedMotion: true });

export function useMotion() {
  return useContext(MotionContext);
}
