"use client";

import { motion, useReducedMotion } from "motion/react";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface RadialProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label: string; // e.g. "82%" — rendered in the center, never color-only
  sublabel?: string; // e.g. a concept name, rendered below the ring
  colorClassName?: string; // stroke color utility class, defaults to primary
  className?: string;
}

/**
 * Accessible radial gauge: the percentage is always rendered as visible text
 * (not conveyed by color/angle alone), per WCAG guidance for KPI gauges.
 */
export function RadialProgress({
  value,
  size = 96,
  strokeWidth = 8,
  label,
  sublabel,
  colorClassName = "stroke-primary",
  className,
}: RadialProgressProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="img"
        aria-label={`${sublabel ? sublabel + ": " : ""}${label}`}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-muted"
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={colorClassName}
            strokeDasharray={circumference}
            initial={reduceMotion ? false : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: duration.slow * 2, ease: ease.enter }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold" aria-hidden="true">
          {label}
        </div>
      </div>
      {sublabel && <p className="text-xs text-muted-foreground text-center max-w-24 truncate" title={sublabel}>{sublabel}</p>}
    </div>
  );
}
