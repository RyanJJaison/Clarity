import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard } from "@/components/motion/HoverCard";
import type { Recommendation } from "@/lib/dashboard-data";

/** One "recommended for you" item — always paired with the real signal that produced it. */
export function RecommendationCard({ title, reason, href }: Recommendation) {
  return (
    <HoverCard>
      <div className="flex items-start gap-3 rounded-lg border p-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <SparklesIcon className="size-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={href}>Go</Link>
        </Button>
      </div>
    </HoverCard>
  );
}
