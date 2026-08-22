"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Max travel distance in px across the element's scroll range. Keep subtle: 24-60. */
  offset?: number;
}

/**
 * Subtle scroll-linked parallax. Transform-only (translateY), GPU-composited.
 * Scroll-linked values aren't covered by MotionConfig's reducedMotion="user"
 * (they're not prop-driven animations), so this checks useReducedMotion()
 * directly and renders a static element when it's set.
 */
export function Parallax({ children, className, offset = 40 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} className={className} style={reduceMotion ? undefined : { y }}>
      {children}
    </motion.div>
  );
}
