"use client";

import { AnimatePresence, motion } from "motion/react";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface EasterEggMessageProps {
  message: string | null;
  position: { left: string; top: string };
  className?: string;
}

/**
 * The small glass message shown after clicking a decorative object (plant,
 * a non-subject book, the trophy...). Purely local state — no route, no
 * backend call. Auto-managed by whichever hook drives `message` (usually a
 * few seconds of visibility, cleared by the caller).
 */
export function EasterEggMessage({ message, position, className }: EasterEggMessageProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98, transition: transition.exit }}
          transition={transition.enter}
          style={{ left: position.left, top: position.top }}
          className={cn(
            "pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--glass-border)] bg-surface-glass px-3 py-1.5 text-xs font-medium text-foreground shadow-glass backdrop-blur-[var(--glass-blur)]",
            className
          )}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
