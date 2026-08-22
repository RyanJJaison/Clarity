"use client";

import { motion, type MotionValue } from "motion/react";
import { WindowArt, PlantArt } from "./artwork";

interface ClassroomBackgroundProps {
  /** Tablet tier: drop the second plant, keep wall/window/floor. */
  simplified?: boolean;
  offsets?: {
    midground: { x: MotionValue<number>; y: MotionValue<number> };
  };
}

/**
 * Passive scene layers — background wall, windows, a hint of outside
 * environment, floor, and (desktop only) ambient decor like a clock and a
 * second plant. Everything here is aria-hidden: it's atmosphere, not
 * content or navigation.
 */
export function ClassroomBackground({ simplified = false, offsets }: ClassroomBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl" aria-hidden="true">
      {/* Wall */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, var(--classroom-wall-top), var(--classroom-wall-bottom))" }}
      />
      {/* Floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[22%]"
        style={{
          background: "linear-gradient(180deg, transparent, var(--classroom-floor))",
        }}
      />

      {/* Windows — midground depth */}
      <motion.div
        className="absolute left-[6%] top-[8%] w-[20%] max-w-40 aspect-[220/260] drop-shadow-lg"
        style={offsets ? { x: offsets.midground.x, y: offsets.midground.y } : undefined}
      >
        <WindowArt className="w-full h-full" />
      </motion.div>
      <motion.div
        className="absolute right-[8%] top-[10%] w-[16%] max-w-32 aspect-[220/260] drop-shadow-lg"
        style={offsets ? { x: offsets.midground.x, y: offsets.midground.y } : undefined}
      >
        <WindowArt className="w-full h-full" />
      </motion.div>

      {!simplified && (
        <div className="absolute right-[3%] bottom-[2%] w-[10%] max-w-24">
          <PlantArt className="w-full h-full" />
        </div>
      )}
    </div>
  );
}
