"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { hoverLift } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Subtle hover lift for non-card elements — nav items, list rows, icon
 * buttons. Lighter than HoverCard (no scale, no tap treatment). Transform-only.
 */
export function HoverLift({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div className={cn(className)} whileHover={reduceMotion ? undefined : hoverLift}>
      {children}
    </motion.div>
  );
}
