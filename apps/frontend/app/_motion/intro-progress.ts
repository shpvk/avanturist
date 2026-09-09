"use client";

const milestones = ["fonts", "hero"] as const;

export type IntroMilestone = (typeof milestones)[number];

const reached = new Set<IntroMilestone>();
const waiting = new Set<() => void>();

let released = false;
let running = false;

export function markIntroMilestone(name: IntroMilestone): void {
  reached.add(name);
}

export function introProgress(): number {
  return reached.size / milestones.length;
}

export function introComplete(): boolean {
  return reached.size === milestones.length;
}

export function claimIntro(): void {
  running = true;
}

export function releaseIntro(): void {
  released = true;
  running = false;
  waiting.forEach((callback) => callback());
  waiting.clear();
}

export function whenIntroDone(callback: () => void): () => void {
  if (released || !running) {
    callback();
    return () => {};
  }
  waiting.add(callback);
  return () => {
    waiting.delete(callback);
  };
}
