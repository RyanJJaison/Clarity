"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { pressScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Button-press primitive: a small scale-down on tap/click-hold, spring back
 * on release. Wrap any clickable element (including a shadcn Button) that
 * wants tactile feedback beyond its default hover state.
 */
export function PressScale({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div className={cn("inline-flex", className)} whileTap={reduceMotion ? undefined : pressScale}>
      {children}
    </motion.div>
  );
}
