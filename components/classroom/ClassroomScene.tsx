"use client";

import { useRef } from "react";
import Link from "next/link";
import type { CourseSummary } from "@/components/navigation/nav-config";
import { ClassroomBackground } from "./ClassroomBackground";
import { ClassroomLighting } from "./ClassroomLighting";
import { ClassroomNavigation, type ContinueLearningSummary, type TodaysFocusSummary } from "./ClassroomNavigation";
import { MobileClassroom } from "./MobileClassroom";
import { useMouseParallax, useLayerOffset } from "./useMouseParallax";
import { useSceneTier } from "./useSceneTier";
import { Reveal } from "@/components/motion/Reveal";
import { AIInvigilator } from "@/components/ai-invigilator/AIInvigilator";
import { InvigilatorBubble, InvigilatorAction } from "@/components/ai-invigilator/InvigilatorBubble";
import { useInvigilatorGreeting } from "@/components/ai-invigilator/useInvigilatorGreeting";

interface ClassroomSceneProps {
  courses: CourseSummary[];
  todaysFocus: TodaysFocusSummary | null;
  continueLearning: ContinueLearningSummary | null;
}

/**
 * Clarity's signature visual identity: a layered 2D classroom where the
 * furniture doubles as navigation AND carries real content (Today's Focus
 * on the whiteboard, Continue Learning on the desk) — this scene IS the
 * dashboard's primary surface, not a decorative header above a list of
 * generic cards. The AI Invigilator stands in the room as a scene element,
 * not a separate greeting card floating above it.
 *
 * Three genuinely different tiers — not one scene with CSS breakpoints
 * hiding parts of it — so a phone never constructs (or pays the parallax-
 * listener cost of) the desktop DOM tree. See useSceneTier for why the
 * default/SSR tier is "mobile".
 */
export function ClassroomScene({ courses, todaysFocus, continueLearning }: ClassroomSceneProps) {
  const tier = useSceneTier();
  const containerRef = useRef<HTMLDivElement>(null);
  // Kept deliberately subtle — roughly 1-5px of total travel, not a
  // "look around the room" game effect.
  const mouse = useMouseParallax(containerRef, 3);
  const midground = useLayerOffset(mouse, 1);
  const foreground = useLayerOffset(mouse, 1.5);

  const focusCourse = courses[0];
  const { message, loading } = useInvigilatorGreeting(focusCourse?.title);

  if (tier === "mobile") {
    return (
      <Reveal tier="background">
        <MobileClassroom courses={courses} todaysFocus={todaysFocus} continueLearning={continueLearning} />
      </Reveal>
    );
  }

  const invigilatorState = loading ? "thinking" : "greeting";

  return (
    <Reveal tier="background">
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/10] lg:aspect-[16/9] rounded-3xl overflow-hidden ring-1 ring-[var(--glass-border)]"
      >
        <ClassroomBackground simplified={tier === "tablet"} offsets={tier === "desktop" ? { midground } : undefined} />
        <ClassroomLighting />
        <ClassroomNavigation
          courses={courses}
          todaysFocus={todaysFocus}
          continueLearning={continueLearning}
          simplified={tier === "tablet"}
          offsets={tier === "desktop" ? { midground, foreground } : undefined}
        />

        {/* AI Invigilator — a scene element, standing by the desk */}
        <div className="absolute left-[60%] top-[48%] w-[14%] max-w-32 z-10">
          <AIInvigilator state={invigilatorState} fluid />
        </div>
        <div className="absolute left-[74%] top-[32%] w-1/4 max-w-64 z-10">
          <InvigilatorBubble message={message ?? ""} loading={loading}>
            {todaysFocus && (
              <InvigilatorAction asChild>
                <Link href={todaysFocus.href}>Continue</Link>
              </InvigilatorAction>
            )}
          </InvigilatorBubble>
        </div>
      </div>
    </Reveal>
  );
}
