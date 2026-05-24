export const currencyTabTransition = {
  durationMs: 200,
  easing: "cubic-bezier(.2,.8,.2,1)",
} as const;

export const currencyContentTransition = {
  exitMs: 200,
  enterMs: 200,
  easing: "cubic-bezier(.2,.8,.2,1)",
} as const;

export const chartSwitchTransition = {
  durationMs: 600,
  easing: "cubic-bezier(.2,.8,.2,1)",
} as const;

export const cardHoverMotion = {
  durationMs: 120,
  translateY: 0,
  scale: 1,
  easing: "ease-out",
} as const;

export const numberTransition = {
  durationMs: 200,
} as const;
