"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type GlassButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

/**
 * Reusable dark-glass button with subtle motion affordances.
 */
export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { className, type = "button", children, ...props },
  ref
) {
  const reduceMotion = useReducedMotion();

  const hoverAnimation = reduceMotion
    ? undefined
    : {
        y: -2,
        scale: 1.02,
        transition: spring.snappy,
      };

  const tapAnimation = reduceMotion
    ? undefined
    : {
        scale: 0.97,
        transition: spring.snappy,
      };

  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
        "bg-black/30 text-white",
        "border border-white/20",
        "backdrop-blur-md",
        "outline-none",
        "focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});
