"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cardHover, pressScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** A div that lifts slightly on hover and settles on tap. Use around Card for dashboard/landing tiles. */
export function HoverCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("cursor-pointer", className)}
      whileHover={reduceMotion ? undefined : cardHover}
      whileTap={reduceMotion ? undefined : pressScale}
    >
      {children}
    </motion.div>
  );
}
