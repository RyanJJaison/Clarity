"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";

/**
 * Cursor-driven parallax for a static scene (as opposed to Parallax's
 * page-scroll-driven version, used for genuinely scrolling content). Tracks
 * pointer position within `containerRef` and exposes spring-smoothed x/y
 * motion values scaled by `strength` (px). Disabled under reduced motion —
 * returns motion values pinned at 0.
 */
export function useMouseParallax(
  containerRef: React.RefObject<HTMLElement | null>,
  strength = 12
): { x: MotionValue<number>; y: MotionValue<number> } {
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 120, damping: 20, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 120, damping: 20, mass: 0.5 });
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || reduceMotion) return;

    function onPointerMove(e: PointerEvent) {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const rect = el!.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        rawX.set(relX * strength * 2);
        rawY.set(relY * strength * 2);
      });
    }

    function onPointerLeave() {
      rawX.set(0);
      rawY.set(0);
    }

    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerleave", onPointerLeave);
    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [containerRef, strength, reduceMotion, rawX, rawY]);

  return { x, y };
}

/** Scales a shared x/y pair down for a background-depth layer (subtler than midground/foreground). */
export function useLayerOffset(
  base: { x: MotionValue<number>; y: MotionValue<number> },
  factor: number
): { x: MotionValue<number>; y: MotionValue<number> } {
  const x = useTransform(base.x, (v) => v * factor);
  const y = useTransform(base.y, (v) => v * factor);
  return { x, y };
}
