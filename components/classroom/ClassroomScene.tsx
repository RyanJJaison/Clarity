"use client";

import { useRef } from "react";
import type { CourseSummary } from "@/components/navigation/nav-config";
import { ClassroomBackground } from "./ClassroomBackground";
import { ClassroomLighting } from "./ClassroomLighting";
import { ClassroomNavigation } from "./ClassroomNavigation";
import { MobileClassroom } from "./MobileClassroom";
import { useMouseParallax, useLayerOffset } from "./useMouseParallax";
import { useSceneTier } from "./useSceneTier";
import { Reveal } from "@/components/motion/Reveal";

interface ClassroomSceneProps {
  courses: CourseSummary[];
}

/**
 * Clarity's signature visual identity: a layered 2D classroom where the
 * furniture doubles as navigation. Three genuinely different tiers — not
 * one scene with CSS breakpoints hiding parts of it — so a phone never
 * constructs (or pays the parallax-listener cost of) the desktop DOM tree.
 * See useSceneTier for why the default/SSR tier is "mobile".
 */
export function ClassroomScene({ courses }: ClassroomSceneProps) {
  const tier = useSceneTier();
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useMouseParallax(containerRef, 10);
  const background = useLayerOffset(mouse, 0.5);
  const midground = useLayerOffset(mouse, 1);
  const foreground = useLayerOffset(mouse, 1.5);

  if (tier === "mobile") {
    return (
      <Reveal tier="background">
        <MobileClassroom courses={courses} />
      </Reveal>
    );
  }

  if (tier === "tablet") {
    return (
      <Reveal tier="background">
        <div className="relative w-full aspect-[16/11] rounded-3xl overflow-hidden ring-1 ring-[var(--glass-border)]">
          <ClassroomBackground simplified />
          <ClassroomLighting />
          <ClassroomNavigation courses={courses} simplified />
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal tier="background">
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/8] rounded-3xl overflow-hidden ring-1 ring-[var(--glass-border)]"
      >
        <ClassroomBackground offsets={{ background, midground }} />
        <ClassroomLighting />
        <ClassroomNavigation courses={courses} offsets={{ midground, foreground }} />
      </div>
    </Reveal>
  );
}
