"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { spring } from "@/lib/motion";

interface SharedElementProps {
  children: ReactNode;
  /** Stable id shared between the two elements being morphed between (e.g. a card and its expanded detail view). */
  layoutId: string;
  className?: string;
}

/**
 * Shared layout transition: two elements (typically on different
 * pages/states) that share a `layoutId` morph into each other instead of
 * cross-fading. Motion handles the FLIP-style transform math; this just
 * standardizes the spring used so every shared-element morph in the app
 * feels the same.
 */
export function SharedElement({ children, layoutId, className }: SharedElementProps) {
  return (
    <motion.div layoutId={layoutId} className={className} transition={spring.gentle}>
      {children}
    </motion.div>
  );
}
