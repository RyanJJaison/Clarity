"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { transition } from "@/lib/motion";

/**
 * App-wide motion configuration. `reducedMotion="user"` makes every
 * `motion.*` component automatically respect the OS-level
 * prefers-reduced-motion setting — transform/layout animations resolve
 * straight to their end state, opacity fades still play. Individual
 * primitives (Parallax, AnimatedNumber) that drive scroll-linked or
 * imperative values outside the animate/whileHover/whileTap prop system
 * still check `useReducedMotion()` themselves, since this provider can't
 * see those.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={transition.normal}>
      {children}
    </MotionConfig>
  );
}
