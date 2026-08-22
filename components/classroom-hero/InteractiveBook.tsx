"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";
import { cropToBackgroundStyle, rectToPositionPercent, type PixelRect } from "./backgroundCrop";
import { GlassTooltip } from "./GlassTooltip";
import { useState } from "react";

interface InteractiveBookProps {
  crop: PixelRect;
  imageUrl: string;
  /** A real course → clicking navigates there (functional). Omit for a decorative book. */
  course?: { id: string; title: string };
  /** Shown via the shared Easter-egg message system when this book has no course (decorative). */
  trivia?: string;
  onDecorativeClick: (message: string) => void;
  /** Small alternating tilt so the shelf doesn't look mechanically uniform. */
  tiltDeg?: number;
}

/**
 * One book on the shelf, "pulled out" on hover using the same hero image
 * cropped to just this slice (see backgroundCrop.ts) — genuine pixel
 * content shifts by 6-14px, not the whole bookshelf scaling. Functional
 * books (a real course exists) navigate on click; the rest show a small
 * decorative message — the distinction is explicit via the `course` prop,
 * never implicit.
 */
export function InteractiveBook({ crop, imageUrl, course, trivia, onDecorativeClick, tiltDeg = 0 }: InteractiveBookProps) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const position = rectToPositionPercent(crop);
  const label = course ? `Bookshelf — open ${course.title}` : "Bookshelf — a book catches your eye";

  function handleActivate() {
    if (course) {
      router.push(`/courses/${course.id}`);
    } else {
      onDecorativeClick(trivia ?? "Curiosity unlocked.");
    }
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleActivate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="group/book absolute rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      style={position}
    >
      <motion.div
        className="h-full w-full rounded-[2px]"
        style={{ ...cropToBackgroundStyle(crop, imageUrl), rotate: tiltDeg }}
        animate={
          reduceMotion
            ? undefined
            : {
                y: hovered ? -10 : 0,
                scale: hovered ? 1.04 : 1,
                filter: hovered ? "brightness(1.08)" : "brightness(1)",
                boxShadow: hovered ? "0 6px 14px -4px rgb(0 0 0 / 0.28)" : "0 0px 0px 0px rgb(0 0 0 / 0)",
              }
        }
        transition={spring.snappy}
      />
      <GlassTooltip visible={hovered} className="left-1/2 -translate-x-1/2 -top-2 -translate-y-full">
        {course ? course.title : "A book"}
      </GlassTooltip>
    </button>
  );
}
