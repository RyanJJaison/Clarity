"use client";

import { motion } from "motion/react";
import { transition } from "@/lib/motion";

export type LightingMood = "morning" | "golden" | "cool";

const MOOD_GRADIENT: Record<LightingMood, string> = {
  morning: "radial-gradient(55% 45% at 15% 10%, rgb(255 233 168 / 0.22), transparent 70%)",
  golden: "radial-gradient(60% 50% at 20% 15%, rgb(255 200 120 / 0.32), transparent 72%)",
  cool: "radial-gradient(55% 45% at 15% 10%, rgb(150 190 255 / 0.2), transparent 70%)",
};

/**
 * Passive lighting-mood overlay for the classroom hero — pure CSS gradient,
 * no continuous animation. The window/lamp Easter eggs shift `mood`, which
 * cross-fades this overlay's gradient via opacity, never a layout property.
 */
export function AmbientLayer({ mood }: { mood: LightingMood }) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden" aria-hidden="true">
      {(Object.keys(MOOD_GRADIENT) as LightingMood[]).map((key) => (
        <motion.div
          key={key}
          className="absolute inset-0"
          style={{ background: MOOD_GRADIENT[key] }}
          animate={{ opacity: mood === key ? 1 : 0 }}
          transition={transition.slow}
        />
      ))}
    </div>
  );
}
