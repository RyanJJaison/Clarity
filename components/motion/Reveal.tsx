"use client";

import { motion, useReducedMotion, type TargetAndTransition } from "motion/react";
import type { ReactNode } from "react";
import {
  hierarchy,
  revealVariants,
  staggerContainer,
  staggerItem,
  viewport,
  withDelay,
  type HierarchyTier,
  type RevealVariantName,
} from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Which entrance plays. Defaults to "fadeUp". */
  variant?: RevealVariantName;
  /** "mount" (default) plays once on mount; "scroll" plays when scrolled into view. */
  trigger?: "mount" | "scroll";
  /** Extra delay in seconds, stacked on top of `tier`. */
  delay?: number;
  /** Named hierarchy delay — background → content → primaryAction → secondaryElements. */
  tier?: HierarchyTier;
  /** Override the variant's default travel distance (px). Only applies to fadeUp/fadeDown. */
  y?: number;
}

/**
 * The general-purpose entrance primitive: fade in, fade up, fade down,
 * slide in, or scale in — chosen via `variant` — triggered on mount or on
 * scroll into view. Respects prefers-reduced-motion.
 */
export function Reveal({ children, className, variant = "fadeUp", trigger = "mount", delay = 0, tier, y }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const totalDelay = (tier ? hierarchy[tier] : 0) + delay;

  let base = revealVariants[variant];
  if (y !== undefined && "y" in (base.hidden as TargetAndTransition)) {
    base = { ...base, hidden: { ...(base.hidden as TargetAndTransition), y } };
  }
  const resolved = withDelay(base, totalDelay);

  const triggerProps =
    trigger === "scroll"
      ? { whileInView: "show" as const, viewport }
      : { animate: "show" as const };

  return (
    <motion.div className={className} initial={reduceMotion ? false : "hidden"} variants={resolved} {...triggerProps}>
      {children}
    </motion.div>
  );
}

/** Named alias of `<Reveal trigger="scroll">` for call-site clarity. */
export function ScrollReveal(props: Omit<RevealProps, "trigger">) {
  return <Reveal {...props} trigger="scroll" />;
}

/** Wraps a list of children and staggers their entrance. Use with <StaggerItem>. */
export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      animate="show"
      variants={reduceMotion ? undefined : staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}
