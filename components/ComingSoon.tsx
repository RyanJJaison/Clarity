import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Honest placeholder for nav destinations that don't have a real feature
 * behind them yet (Assignments, Schedule, Achievements) — a working page
 * with a clear, non-fabricated message rather than a dead link or, worse,
 * invented data.
 */
export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <Reveal className="max-w-sm text-center flex flex-col items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </Reveal>
    </main>
  );
}
