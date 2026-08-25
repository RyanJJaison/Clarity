import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HoverCard } from "@/components/motion/HoverCard";
import type { Deadline } from "@/lib/dashboard-data";

function urgencyClass(daysRemaining: number): string {
  if (daysRemaining < 0) return "bg-muted text-muted-foreground";
  if (daysRemaining <= 3) return "bg-destructive/10 text-destructive";
  if (daysRemaining <= 10) return "bg-warning/10 text-warning";
  return "bg-primary/10 text-primary";
}

function daysLabel(daysRemaining: number): string {
  if (daysRemaining < 0) return "Past due";
  if (daysRemaining === 0) return "Today";
  if (daysRemaining === 1) return "1 day to go";
  return `${daysRemaining} days to go`;
}

/** A course's real exam/deadline date — never a fabricated "topics remaining" count, just the date and real mastery. */
export function DeadlineCard({ deadline }: { deadline: Deadline }) {
  // Date-only string ("YYYY-MM-DD") — format in UTC so the displayed day never shifts with the viewer's timezone.
  const date = new Date(deadline.examDate);
  const month = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  const day = date.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" });

  return (
    <HoverCard>
      <Card className="overflow-hidden py-0">
        <Link href={`/courses/${deadline.courseId}`} className="block">
          <CardContent className="flex items-center gap-4 py-4">
            <div
              className={`flex flex-col items-center justify-center rounded-xl size-14 shrink-0 ${urgencyClass(deadline.daysRemaining)}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide">{month}</span>
              <span className="font-heading text-lg font-bold leading-none">{day}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold truncate">{deadline.title}</h3>
              <p className="text-sm text-muted-foreground">
                {deadline.masteryPercent !== null ? `${deadline.masteryPercent}% mastery` : "Not started yet"}
              </p>
            </div>
            <p className={`text-sm font-semibold shrink-0 ${deadline.daysRemaining <= 3 ? "text-destructive" : "text-foreground"}`}>
              {daysLabel(deadline.daysRemaining)}
            </p>
            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
          </CardContent>
        </Link>
      </Card>
    </HoverCard>
  );
}
