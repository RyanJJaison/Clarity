"use client";

import type { MotionValue } from "motion/react";
import { buildNavItems, type CourseSummary } from "@/components/navigation/nav-config";
import { ClassroomObject } from "./ClassroomObject";
import {
  WhiteboardArt,
  BookshelfArt,
  DeskArt,
  ComputerArt,
  NoticeBoardArt,
  CalendarArt,
  TrophyShelfArt,
  ClockArt,
} from "./artwork";

export interface TodaysFocusSummary {
  title: string;
  detail: string; // e.g. "68% mastery" or "3 cards due"
  href: string;
}

export interface ContinueLearningSummary {
  title: string;
  detail: string; // e.g. "Lesson 3 of 7 started"
  href: string;
}

interface ClassroomNavigationProps {
  courses: CourseSummary[];
  todaysFocus: TodaysFocusSummary | null;
  continueLearning: ContinueLearningSummary | null;
  simplified?: boolean;
  offsets?: {
    midground: { x: MotionValue<number>; y: MotionValue<number> };
    foreground: { x: MotionValue<number>; y: MotionValue<number> };
  };
}

/**
 * The eight classroom objects, positioned as a believable room and wired to
 * real destinations. Reuses nav-config's buildNavItems() (the same source
 * of truth as the navbar/mobile-nav/command palette) for Learn/AI Tools/
 * Assignments/Calendar/Achievements, so the classroom can't link somewhere
 * the rest of the app doesn't. Whiteboard and Desk render the actual
 * Today's Focus / Continue Learning content directly on the object —
 * not a separate card floating elsewhere.
 */
export function ClassroomNavigation({
  courses,
  todaysFocus,
  continueLearning,
  simplified = false,
  offsets,
}: ClassroomNavigationProps) {
  const nav = buildNavItems(courses);
  const byId = (id: string) => nav.find((n) => n.id === id)!;

  const overlayLabel = (title: string, detail: string) => (
    <div className="absolute inset-x-[12%] top-[14%] text-left pointer-events-none">
      <p className="text-[9px] sm:text-[10px] font-semibold text-white/70 uppercase tracking-wide truncate">
        {title}
      </p>
      <p className="text-[10px] sm:text-xs font-semibold text-white truncate">{detail}</p>
    </div>
  );

  const objects = [
    {
      id: "whiteboard",
      label: todaysFocus
        ? `Whiteboard — Today's Focus: ${todaysFocus.title}, ${todaysFocus.detail}`
        : "Whiteboard — Today's Focus",
      href: todaysFocus?.href ?? "#today-focus",
      art: <WhiteboardArt className="w-full h-auto drop-shadow-lg" />,
      overlay: todaysFocus ? overlayLabel("Today's focus", todaysFocus.title) : undefined,
      position: { left: "34%", top: "4%" },
      width: "28%",
      depth: "midground" as const,
    },
    {
      id: "bookshelf",
      label: `Bookshelf — ${byId("learn").label}`,
      href: byId("learn").href,
      art: <BookshelfArt className="w-full h-auto drop-shadow-lg" />,
      position: { left: "1%", top: "40%" },
      width: "19%",
      depth: "midground" as const,
    },
    {
      id: "desk",
      label: continueLearning
        ? `Desk — Continue Learning: ${continueLearning.title}, ${continueLearning.detail}`
        : "Desk — Continue Learning",
      href: continueLearning?.href ?? "/courses/new",
      art: <DeskArt className="w-full h-auto drop-shadow-lg" />,
      overlay: continueLearning ? overlayLabel("Continue learning", continueLearning.title) : undefined,
      position: { left: "24%", top: "62%" },
      width: "38%",
      depth: "foreground" as const,
    },
    {
      id: "computer",
      label: `Computer — ${byId("ai-tools").label}`,
      href: byId("ai-tools").href,
      art: <ComputerArt className="w-full h-auto drop-shadow-lg" />,
      position: { left: "40%", top: "44%" },
      width: "17%",
      depth: "foreground" as const,
    },
    {
      id: "noticeboard",
      label: `Notice board — ${byId("assignments").label}`,
      href: byId("assignments").href,
      art: <NoticeBoardArt className="w-full h-auto drop-shadow-lg" />,
      position: { left: "74%", top: "12%" },
      width: "15%",
      depth: "midground" as const,
    },
    {
      id: "calendar",
      label: `Calendar — ${byId("calendar").label}`,
      href: byId("calendar").href,
      art: <CalendarArt className="w-full h-auto drop-shadow-lg" />,
      position: { left: "12%", top: "10%" },
      width: "12%",
      depth: "midground" as const,
    },
    {
      id: "trophyshelf",
      label: `Trophy shelf — ${byId("achievements").label}`,
      href: byId("achievements").href,
      art: <TrophyShelfArt className="w-full h-auto drop-shadow-lg" />,
      position: { left: "80%", top: "40%" },
      width: "18%",
      depth: "midground" as const,
    },
    {
      id: "clock",
      label: "Clock — Focus Mode",
      href: "/focus",
      art: <ClockArt className="w-full h-auto drop-shadow-lg" />,
      position: { left: "48%", top: "2%" },
      width: "7%",
      depth: "background" as const,
    },
  ];

  return (
    <>
      {objects.map((obj) => (
        <ClassroomObject
          key={obj.id}
          href={obj.href}
          label={obj.label}
          art={obj.art}
          overlay={"overlay" in obj ? obj.overlay : undefined}
          position={obj.position}
          width={obj.width}
          alwaysShowLabel={simplified}
          offset={offsets ? offsets[obj.depth === "foreground" ? "foreground" : "midground"] : undefined}
        />
      ))}
    </>
  );
}
