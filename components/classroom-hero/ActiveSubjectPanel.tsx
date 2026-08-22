"use client";

import { motion, useReducedMotion } from "motion/react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { transition } from "@/lib/motion";
import { rectToPositionPercent } from "./backgroundCrop";

interface ActiveSubjectPanelProps {
  title: string;
  subtitle: string;
  progressPercent: number; // 0-100, real mastery — never fabricated
}

const POSITION = rectToPositionPercent({ x: 380, y: 455, w: 320, h: 100 });

export function ActiveSubjectPanel({ title, subtitle, progressPercent }: ActiveSubjectPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <GlassPanel className="absolute flex flex-col gap-3 p-[18px]" style={POSITION}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-[16px] font-bold text-foreground truncate">{title}</p>
          <p className="text-xs text-subtle truncate">{subtitle}</p>
        </div>
        <p className="font-heading text-lg font-extrabold text-primary shrink-0">{progressPercent}%</p>
      </div>
      <div className="h-[10px] w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={transition.slow}
        />
      </div>
    </GlassPanel>
  );
}
