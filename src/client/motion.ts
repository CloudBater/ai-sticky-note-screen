export const currencyTabTransition = {
  durationMs: 420,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const currencyContentTransition = {
  exitMs: 220,
  enterMs: 480,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const chartSwitchTransition = {
  durationMs: 520,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const cardHoverMotion = {
  durationMs: 360,
  translateY: -4,
  scale: 1.01,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const numberTransition = {
  durationMs: 760,
} as const;
