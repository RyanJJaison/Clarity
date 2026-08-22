"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { pageVariants } from "@/lib/motion";

/**
 * Fades/lifts each route in on mount and settles the previous one out on
 * navigation. Wraps {children} once in the root layout — pages don't need
 * to know about it. Keyed by pathname so App Router route changes trigger
 * enter/exit instead of an in-place re-render.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className="flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
