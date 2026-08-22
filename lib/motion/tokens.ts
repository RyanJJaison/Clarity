import type { Easing, Transition } from "motion/react";

/**
 * Central motion configuration for Clarity.
 *
 * Every animated component in the app should source its timing from here
 * instead of hardcoding durations/eases/offsets — that's what keeps the
 * product feeling like one system instead of a pile of one-off tweaks.
 *
 * Design intent: fluid, premium, subtle. We animate `transform` and
 * `opacity` only (GPU-composited, no layout thrash) — never `filter`,
 * `width`/`height`, or `top`/`left`. See references/quick-reference.md
 * (ui-ux-pro-max skill) §7 for the rationale.
 */

// ---------------------------------------------------------------------------
// Duration — seconds. Three tiers, nothing in between.
// ---------------------------------------------------------------------------
export const duration = {
  /** Micro-interactions: hover, press, toggles. Should feel instant. */
  fast: 0.15,
  /** Default: reveals, card entrances, most UI motion. */
  normal: 0.3,
  /** Larger surfaces: page transitions, modals, hero reveals. */
  slow: 0.5,
} as const;

// ---------------------------------------------------------------------------
// Easing — cubic-bezier curves for tween transitions, plus a spring preset.
// ---------------------------------------------------------------------------
export const ease = {
  /** Balanced, for state changes that aren't entering/exiting (hover, press). */
  standard: [0.4, 0, 0.2, 1] as Easing,
  /** Decelerate — elements arriving. Fast start, gentle settle (Apple-style ease-out). */
  enter: [0.16, 1, 0.3, 1] as Easing,
  /** Accelerate — elements leaving. Exits should read as quicker than entries. */
  exit: [0.4, 0, 1, 1] as Easing,
  /**
   * Spring token. Unlike the three curves above, this is a full Transition
   * (springs are duration-less) — spread it directly: `transition={ease.spring}`.
   */
  spring: { type: "spring", stiffness: 380, damping: 30, mass: 0.9 } as Transition,
} as const;

// ---------------------------------------------------------------------------
// Spring presets — for the "spring transitions" primitive category. Pick by feel.
// ---------------------------------------------------------------------------
export const spring = {
  /** Small, fast elements: buttons, icons, toggles. */
  snappy: { type: "spring", stiffness: 500, damping: 32, mass: 0.7 } as Transition,
  /** Default: cards, panels, most spring-driven motion. Same as ease.spring. */
  smooth: ease.spring,
  /** Larger surfaces that want a touch more settle: modals, sheets. */
  gentle: { type: "spring", stiffness: 260, damping: 28, mass: 1 } as Transition,
} as const;

// ---------------------------------------------------------------------------
// Distance — px offsets for fade-up/down/slide/parallax. Transform-only.
// ---------------------------------------------------------------------------
export const distance = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 32,
  xl: 64,
} as const;

// ---------------------------------------------------------------------------
// Stagger — seconds between staggered children.
// ---------------------------------------------------------------------------
export const stagger = {
  tight: 0.04,
  normal: 0.08,
  loose: 0.12,
  /** Delay before the first child starts, so the container isn't racing its own children. */
  delayChildren: 0.05,
} as const;

// ---------------------------------------------------------------------------
// Hierarchy — a delay ladder that lets motion narrate visual order:
// background → content → primary action → secondary elements.
// Compose a component's entrance delay from this instead of a magic number.
// ---------------------------------------------------------------------------
export const hierarchy = {
  background: 0,
  content: 0.08,
  primaryAction: 0.16,
  secondaryElements: 0.24,
} as const;

export type HierarchyTier = keyof typeof hierarchy;

// ---------------------------------------------------------------------------
// Viewport — default trigger settings for scroll-linked reveals.
// ---------------------------------------------------------------------------
export const viewport = {
  once: true,
  amount: 0.2,
  margin: "-10% 0px -10% 0px",
} as const;

// ---------------------------------------------------------------------------
// Parallax depth — page-scroll travel ratio per layer tier. A background
// layer moves at 5% of scroll speed, midground 10%, foreground 15% — keep
// these small; parallax here is atmosphere, not a game-world effect.
// ---------------------------------------------------------------------------
export const parallaxDepth = {
  background: 0.05,
  midground: 0.1,
  foreground: 0.15,
} as const;

export type ParallaxDepthTier = keyof typeof parallaxDepth;

// ---------------------------------------------------------------------------
// Precomposed tween transitions — the common case of "duration + standard ease".
// ---------------------------------------------------------------------------
export const transition = {
  fast: { duration: duration.fast, ease: ease.standard } satisfies Transition,
  normal: { duration: duration.normal, ease: ease.standard } satisfies Transition,
  slow: { duration: duration.slow, ease: ease.standard } satisfies Transition,
  enter: { duration: duration.normal, ease: ease.enter } satisfies Transition,
  exit: { duration: duration.fast, ease: ease.exit } satisfies Transition,
} as const;
