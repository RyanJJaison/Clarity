"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion, useTransform } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

/** Counts up from 0 (or the previous value) to `value` on mount/change. */
export function AnimatedNumber({ value, className, suffix = "", decimals = 0, duration = 0.9 }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => v.toFixed(decimals));
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, duration, reduceMotion, motionValue]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (spanRef.current) spanRef.current.textContent = `${v}${suffix}`;
    });
  }, [rounded, suffix]);

  return (
    <span ref={spanRef} className={className}>
      0{suffix}
    </span>
  );
}
