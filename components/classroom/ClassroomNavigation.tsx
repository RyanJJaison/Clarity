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
} from "./artwork";

interface ClassroomNavigationProps {
  courses: CourseSummary[];
  simplified?: boolean;
  offsets?: {
    midground: { x: MotionValue<number>; y: MotionValue<number> };
    foreground: { x: MotionValue<number>; y: MotionValue<number> };
  };
}

/**
 * The seven classroom objects, positioned as a believable room and wired
 * to real destinations. Reuses nav-config's buildNavItems() (the same
 * source of truth as the navbar/mobile-nav/command palette) for
 * Learn/AI Tools/Assignments/Calendar/Achievements, so the classroom can
 * never link somewhere the rest of the app doesn't. Whiteboard/Desk point
 * at the dashboard's own Today's Focus / Continue Learning sections rather
 * than duplicating that logic here.
 */
export function ClassroomNavigation({ courses, simplified = false, offsets }: ClassroomNavigationProps) {
  const nav = buildNavItems(courses);
  const byId = (id: string) => nav.find((n) => n.id === id)!;
  const focusCourse = courses[0];

  const objects = [
    {
      id: "whiteboard",
      label: "Whiteboard — Today's Focus",
      href: "#today-focus",
      art: <WhiteboardArt className="w-full h-auto drop-shadow-lg" />,
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
      label: focusCourse ? `Desk — Continue ${focusCourse.title}` : "Desk — Start learning",
      href: focusCourse ? `/courses/${focusCourse.id}` : "/courses/new",
      art: <DeskArt className="w-full h-auto drop-shadow-lg" />,
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
  ];

  return (
    <>
      {objects.map((obj) => (
        <ClassroomObject
          key={obj.id}
          href={obj.href}
          label={obj.label}
          art={obj.art}
          position={obj.position}
          width={obj.width}
          alwaysShowLabel={simplified}
          offset={offsets ? offsets[obj.depth === "foreground" ? "foreground" : "midground"] : undefined}
        />
      ))}
    </>
  );
}
