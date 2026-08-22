import Link from "next/link";
import { TimerIcon } from "lucide-react";
import { buildNavItems, type CourseSummary } from "@/components/navigation/nav-config";
import { HoverCard } from "@/components/motion/HoverCard";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import type { ContinueLearningSummary, TodaysFocusSummary } from "./ClassroomNavigation";

interface MobileClassroomProps {
  courses: CourseSummary[];
  todaysFocus: TodaysFocusSummary | null;
  continueLearning: ContinueLearningSummary | null;
}

/**
 * Mobile doesn't get the illustrated scene at all — not CSS-hidden, never
 * mounted (see useSceneTier). Just a lightweight atmospheric gradient wash
 * in the classroom palette, plus the same eight destinations as ordinary,
 * fully accessible cards — carrying the same real content the desktop
 * whiteboard/desk show, not a generic label.
 */
export function MobileClassroom({ courses, todaysFocus, continueLearning }: MobileClassroomProps) {
  const nav = buildNavItems(courses);
  const byId = (id: string) => nav.find((n) => n.id === id)!;

  const items = [
    {
      id: "whiteboard",
      label: "Today's Focus",
      detail: todaysFocus?.title,
      href: todaysFocus?.href ?? "#today-focus",
      icon: byId("progress").icon,
    },
    { id: "bookshelf", label: "Subjects", detail: undefined, href: byId("learn").href, icon: byId("learn").icon },
    {
      id: "desk",
      label: "Continue Learning",
      detail: continueLearning?.title,
      href: continueLearning?.href ?? "/courses/new",
      icon: byId("learn").icon,
    },
    { id: "computer", label: "AI Tools", detail: undefined, href: byId("ai-tools").href, icon: byId("ai-tools").icon },
    {
      id: "noticeboard",
      label: "Assignments",
      detail: undefined,
      href: byId("assignments").href,
      icon: byId("assignments").icon,
    },
    { id: "calendar", label: "Schedule", detail: undefined, href: byId("calendar").href, icon: byId("calendar").icon },
    {
      id: "trophyshelf",
      label: "Achievements",
      detail: undefined,
      href: byId("achievements").href,
      icon: byId("achievements").icon,
    },
    { id: "clock", label: "Focus Mode", detail: undefined, href: "/focus", icon: TimerIcon },
  ];

  return (
    <div className="relative rounded-3xl overflow-hidden ring-1 ring-[var(--glass-border)] p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(160deg, var(--classroom-wall-top), var(--classroom-wall-bottom) 60%, var(--classroom-floor))",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-60 dark:opacity-30"
        style={{
          background: "radial-gradient(60% 50% at 15% 0%, var(--classroom-sun), transparent 70%)",
        }}
      />
      <p className="text-xs font-medium text-subtle uppercase tracking-wide mb-3">Your classroom</p>
      <StaggerGroup className="grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <StaggerItem key={item.id}>
            <HoverCard>
              <Link
                href={item.href}
                className="flex flex-col items-start gap-2 rounded-xl border bg-surface-elevated/80 backdrop-blur-sm p-3 min-h-24"
              >
                <item.icon className="size-5 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">{item.label}</span>
                {item.detail && <span className="text-xs text-muted-foreground truncate w-full">{item.detail}</span>}
              </Link>
            </HoverCard>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}
