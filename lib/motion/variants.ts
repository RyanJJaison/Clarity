import type { TargetAndTransition, Variants } from "motion/react";
import { distance, spring, stagger, transition } from "./tokens";

/**
 * Reusable variant objects. All animate only `opacity`/`transform`
 * (x, y, scale) — never filter/width/height/top/left.
 */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: transition.enter },
  exit: { opacity: 0, transition: transition.exit },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: distance.md },
  show: { opacity: 1, y: 0, transition: transition.enter },
  exit: { opacity: 0, y: distance.sm, transition: transition.exit },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -distance.md },
  show: { opacity: 1, y: 0, transition: transition.enter },
  exit: { opacity: 0, y: -distance.sm, transition: transition.exit },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -distance.lg },
  show: { opacity: 1, x: 0, transition: transition.enter },
  exit: { opacity: 0, x: -distance.md, transition: transition.exit },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: distance.lg },
  show: { opacity: 1, x: 0, transition: transition.enter },
  exit: { opacity: 0, x: distance.md, transition: transition.exit },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: transition.enter },
  exit: { opacity: 0, scale: 0.96, transition: transition.exit },
};

/** Named lookup so components can select a variant by string prop. */
export const revealVariants = {
  fadeIn,
  fadeUp,
  fadeDown,
  slideInLeft,
  slideInRight,
  scaleIn,
} as const;

export type RevealVariantName = keyof typeof revealVariants;

// ---------------------------------------------------------------------------
// Staggered children
// ---------------------------------------------------------------------------
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: stagger.normal, delayChildren: stagger.delayChildren },
  },
};

export const staggerItem: Variants = fadeUp;

// ---------------------------------------------------------------------------
// Page transitions — enter settles in, exit is quicker (exit-faster-than-enter).
// ---------------------------------------------------------------------------
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: distance.sm },
  show: { opacity: 1, y: 0, transition: transition.enter },
  exit: { opacity: 0, y: -distance.xs, transition: transition.exit },
};

// ---------------------------------------------------------------------------
// Modal / overlay transitions
// ---------------------------------------------------------------------------
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: transition.fast },
  exit: { opacity: 0, transition: transition.exit },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: distance.sm },
  show: { opacity: 1, scale: 1, y: 0, transition: spring.gentle },
  exit: { opacity: 0, scale: 0.97, y: distance.xs, transition: transition.exit },
};

// ---------------------------------------------------------------------------
// Micro-interactions — hover lift / press. Consumed via whileHover/whileTap,
// not mount variants, so these are transition presets rather than Variants.
// ---------------------------------------------------------------------------
export const hoverLift = {
  y: -4,
  transition: spring.snappy,
};

export const pressScale = {
  scale: 0.96,
  transition: spring.snappy,
};

export const cardHover = {
  y: -6,
  scale: 1.01,
  transition: spring.smooth,
};

/**
 * Merges a per-instance delay into a variant's `show` transition. Variant
 * transitions win over a component-level `transition` prop in Motion, so
 * dynamic delay (e.g. from the hierarchy ladder) has to be composed here
 * rather than passed as a sibling prop.
 */
export function withDelay(base: Variants, delaySeconds: number): Variants {
  const show = base.show as TargetAndTransition;
  return {
    ...base,
    show: { ...show, transition: { ...show.transition, delay: delaySeconds } },
  };
}
