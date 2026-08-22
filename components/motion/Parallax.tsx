"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { parallaxDepth, type ParallaxDepthTier } from "@/lib/motion";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /**
   * Named depth tier — how fast this layer travels relative to page scroll.
   * background ≈0.05x, midground ≈0.1x, foreground ≈0.15x. Keep it subtle;
   * this is atmosphere, not a game-world effect.
   */
  depth?: ParallaxDepthTier;
  /** Escape hatch for a custom ratio when a named tier doesn't fit. */
  ratio?: number;
  /** Move opposite to scroll direction instead of with it. */
  invert?: boolean;
}

/**
 * Page-scroll parallax layer. Transform-only (translateY), GPU-composited,
 * driven by Motion's passive scroll subscription (no per-pixel React
 * re-renders). Disabled entirely under prefers-reduced-motion — scroll-
 * linked values aren't covered by MotionConfig's reducedMotion="user"
 * (they're not prop-driven animations), so this checks useReducedMotion()
 * directly.
 */
export function Parallax({ children, className, depth = "midground", ratio, invert = false }: ParallaxProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const resolvedRatio = (ratio ?? parallaxDepth[depth]) * (invert ? -1 : 1);
  const y = useTransform(scrollY, (v) => v * resolvedRatio);

  return (
    <motion.div className={className} style={reduceMotion ? undefined : { y }}>
      {children}
    </motion.div>
  );
}
