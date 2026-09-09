export const duration = {
  instant: 0.12,
  fast: 0.16,
  slow: 0.32,
  scene: 0.9,
  epic: 1.6,
} as const;

export const ease = {
  base: "power2.out",
  outExpo: "expo.out",
  inOutQuint: "power4.inOut",
} as const;

export const stagger = {
  tight: 0.04,
  loose: 0.08,
} as const;

export const shift = {
  reveal: 18,
  scene: 64,
} as const;
