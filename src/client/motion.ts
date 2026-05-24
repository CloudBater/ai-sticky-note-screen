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

// Spring easing: cubic-bezier(0.34, 1.56, 0.64, 1)
// y2 = 1.56 overshoots past 1.0 → physical spring bounce
export const sectionSpringTransition = {
  durationMs: 420,
  easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
