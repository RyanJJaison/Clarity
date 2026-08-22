import Link from "next/link";
import { buildNavItems, type CourseSummary } from "@/components/navigation/nav-config";
import { HoverCard } from "@/components/motion/HoverCard";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

/**
 * Mobile doesn't get the illustrated scene at all — not CSS-hidden, never
 * mounted (see useSceneTier). Just a lightweight atmospheric gradient wash
 * in the classroom palette, plus the same seven destinations as ordinary,
 * fully accessible cards. This is "atmosphere + standard navigation," not
 * a shrunk-down version of the desktop scene.
 */
export function MobileClassroom({ courses }: { courses: CourseSummary[] }) {
  const nav = buildNavItems(courses);
  const byId = (id: string) => nav.find((n) => n.id === id)!;
  const focusCourse = courses[0];

  const items = [
    { id: "whiteboard", label: "Today's Focus", href: "#today-focus", icon: byId("progress").icon },
    { id: "bookshelf", label: "Subjects", href: byId("learn").href, icon: byId("learn").icon },
    {
      id: "desk",
      label: "Continue Learning",
      href: focusCourse ? `/courses/${focusCourse.id}` : "/courses/new",
      icon: byId("learn").icon,
    },
    { id: "computer", label: "AI Tools", href: byId("ai-tools").href, icon: byId("ai-tools").icon },
    { id: "noticeboard", label: "Assignments", href: byId("assignments").href, icon: byId("assignments").icon },
    { id: "calendar", label: "Schedule", href: byId("calendar").href, icon: byId("calendar").icon },
    { id: "trophyshelf", label: "Achievements", href: byId("achievements").href, icon: byId("achievements").icon },
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
              </Link>
            </HoverCard>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  );
}
