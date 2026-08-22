"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion, type MotionValue } from "motion/react";
import { cardHover, pressScale } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ClassroomObjectProps {
  href: string;
  label: string;
  art: ReactNode;
  /** Percentage-based position within the scene container. */
  position: { left: string; top: string };
  /** Width as a percentage of the scene container. */
  width: string;
  className?: string;
  /** Always show the caption instead of only on hover/focus (tablet/simplified mode). */
  alwaysShowLabel?: boolean;
  offset?: { x: MotionValue<number>; y: MotionValue<number> };
}

/**
 * A single classroom object, used as a real navigation control: it's a
 * Next.js Link (keyboard-focusable, has a visible focus ring, works with
 * screen readers) that happens to be illustrated instead of a text button.
 * The label is always present in the DOM (not hover-only content sighted
 * users need to guess) — desktop just dims it until hover/focus.
 */
export function ClassroomObject({
  href,
  label,
  art,
  position,
  width,
  className,
  alwaysShowLabel = false,
  offset,
}: ClassroomObjectProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("absolute", className)}
      style={{
        left: position.left,
        top: position.top,
        width,
        ...(offset ? { x: offset.x, y: offset.y } : {}),
      }}
    >
      <Link
        href={href}
        aria-label={label}
        className="group/obj relative block focus-visible:outline-none"
      >
        <motion.div
          className="rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          whileHover={reduceMotion ? undefined : cardHover}
          whileTap={reduceMotion ? undefined : pressScale}
        >
          {art}
        </motion.div>
        <span
          className={cn(
            "absolute left-1/2 -bottom-2 -translate-x-1/2 translate-y-full whitespace-nowrap rounded-full border border-[var(--glass-border)] bg-surface-glass px-2.5 py-1 text-xs font-medium shadow-glass backdrop-blur-[var(--glass-blur)] transition-opacity",
            alwaysShowLabel ? "opacity-100" : "opacity-0 group-hover/obj:opacity-100 group-focus-visible/obj:opacity-100"
          )}
        >
          {label}
        </span>
      </Link>
    </motion.div>
  );
}
