import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadialProgress } from "@/components/motion/RadialProgress";
import { HoverCard } from "@/components/motion/HoverCard";

export interface CourseCardProps {
  id: string;
  title: string;
  mode: string;
  /** 0-1 average mastery across the course's tracked concepts, or null if nothing's been attempted yet. */
  progress: number | null;
  variant?: "default" | "featured";
}

/**
 * A course, with real derived progress (average mastery — never a
 * fabricated completion percentage). `featured` is the larger "Continue
 * Learning" treatment; `default` is the compact list-row treatment.
 */
export function CourseCard({ id, title, mode, progress, variant = "default" }: CourseCardProps) {
  if (variant === "featured") {
    return (
      <HoverCard>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-6 pt-6">
            {progress !== null ? (
              <RadialProgress
                value={progress * 100}
                size={72}
                label={`${Math.round(progress * 100)}%`}
                colorClassName={progress < 0.4 ? "stroke-destructive" : progress < 0.75 ? "stroke-accent" : "stroke-primary"}
              />
            ) : (
              <div className="size-[72px] rounded-full border-4 border-dashed border-muted flex items-center justify-center text-xs text-muted-foreground text-center px-2">
                Not started
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-subtle uppercase tracking-wide">Continue learning</p>
              <h3 className="font-heading text-lg font-semibold truncate">{title}</h3>
              <p className="text-sm text-muted-foreground capitalize">{mode} mode</p>
            </div>
            <Button asChild>
              <Link href={`/courses/${id}`}>Continue</Link>
            </Button>
          </CardContent>
        </Card>
      </HoverCard>
    );
  }

  return (
    <HoverCard>
      <Link
        href={`/courses/${id}`}
        className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
      >
        <span className="truncate">{title}</span>
        <span className="flex items-center gap-3 shrink-0">
          {progress !== null && <span className="text-muted-foreground">{Math.round(progress * 100)}% mastery</span>}
          <span className="text-muted-foreground capitalize">{mode}</span>
        </span>
      </Link>
    </HoverCard>
  );
}
