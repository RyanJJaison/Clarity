"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";

/**
 * Returns whether the page has scrolled past `threshold` px. Built on
 * Motion's passive scroll subscription + useMotionValueEvent, so the
 * scroll callback runs every tick but React only re-renders on the rare
 * boolean flip — not on every pixel of scroll. Use to drive navbar
 * opacity/blur/shadow/border transitions.
 */
export function useScrolled(threshold = 8): boolean {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > threshold;
    setScrolled((prev) => (prev === next ? prev : next));
  });

  return scrolled;
}
