"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { modalContent, modalOverlay } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ModalTransitionProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  /** Called when the overlay is clicked. Wire to your own open-state setter. */
  onDismiss?: () => void;
}

/**
 * Overlay + content transition for custom, motion-driven overlays (sheets,
 * the future AI-character bubble, ad-hoc popovers) — scale+fade content
 * over a fading scrim.
 *
 * Note: the existing shadcn `Dialog` (components/ui/dialog.tsx) is Radix,
 * and Radix's own Presence already drives its open/close animation via the
 * `tw-animate-css` data-state classes. That's a CSS transition, not a
 * second JS animation engine, so it doesn't conflict with using `motion`
 * here — but don't wrap DialogContent in this component; Radix's mount/
 * unmount timing and this component's would fight each other. Use this for
 * overlays you build directly with motion instead of Dialog.
 */
export function ModalTransition({ isOpen, children, className, onDismiss }: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 bg-black/40"
            variants={modalOverlay}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onDismiss}
            aria-hidden="true"
          />
          <motion.div
            key="content"
            className={cn("fixed z-50", className)}
            variants={modalContent}
            initial="hidden"
            animate="show"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
