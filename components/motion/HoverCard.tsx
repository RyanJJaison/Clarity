"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A div that lifts slightly on hover/tap. Use around Card for dashboard tiles. */
export function HoverCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("cursor-pointer", className)}
      whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}
