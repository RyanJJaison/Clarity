"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { GlassTooltip } from "./GlassTooltip";

interface HotspotPosition {
  left: string;
  top: string;
  width: string;
  height?: string;
}

interface InteractiveHotspotBaseProps {
  label: string;
  tooltip?: string;
  position: HotspotPosition;
  children: ReactNode;
  className?: string;
  tooltipClassName?: string;
  /** Adds a subtle brightness lift on hover, on top of the transform. Skip for large glass panels that already have their own hover treatment. */
  brighten?: boolean;
  /** Always-visible tooltip instead of hover/focus-only (touch devices, simplified tiers). */
  alwaysShowTooltip?: boolean;
}

type InteractiveHotspotProps =
  | (InteractiveHotspotBaseProps & { href: string; onActivate?: never })
  | (InteractiveHotspotBaseProps & { href?: never; onActivate: () => void });

/**
 * The one reusable primitive every classroom hotspot is built from —
 * whiteboard, computer, notice board, clock, individual books, the
 * Invigilator, easter eggs. Real navigation uses `href` (renders a real
 * Link); local-only interactions (easter eggs) use `onActivate` (renders a
 * real button). Both are genuinely focusable, keyboard-activatable (native
 * Enter/Space — no custom key handling needed), and show their tooltip on
 * focus as well as hover, so nothing important is hover-only.
 *
 * Motion is transform + opacity (+ optional brightness filter, only ever
 * as a discrete hover-triggered transition, never continuous) — 1-3px
 * translate, ~1.02x scale, spring-snappy timing (~200ms feel).
 */
export function InteractiveHotspot(props: InteractiveHotspotProps) {
  const { label, tooltip, position, children, className, tooltipClassName, brighten = false, alwaysShowTooltip = false } = props;
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(false);

  const hoverAnimation = reduceMotion
    ? undefined
    : {
        y: -2,
        scale: 1.02,
        filter: brighten ? "brightness(1.06)" : undefined,
        transition: spring.snappy,
      };

  const content = (
    <>
      <motion.div whileHover={hoverAnimation} whileFocus={hoverAnimation} whileTap={reduceMotion ? undefined : { scale: 0.99 }}>
        {children}
      </motion.div>
      {tooltip && (
        <GlassTooltip
          visible={alwaysShowTooltip || active}
          className={cn("left-1/2 -translate-x-1/2 -bottom-2 translate-y-full", tooltipClassName)}
        >
          {tooltip}
        </GlassTooltip>
      )}
    </>
  );

  const sharedClassName = cn(
    "group/hotspot absolute rounded-2xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className
  );

  const sharedProps = {
    style: { left: position.left, top: position.top, width: position.width, height: position.height },
    "aria-label": label,
    onMouseEnter: () => setActive(true),
    onMouseLeave: () => setActive(false),
    onFocus: () => setActive(true),
    onBlur: () => setActive(false),
  };

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={sharedClassName} {...sharedProps}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={sharedClassName} {...sharedProps} onClick={props.onActivate}>
      {content}
    </button>
  );
}
