import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard } from "@/components/motion/HoverCard";

interface AIToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

/** A single AI-powered quick action — distinctive `ai` button treatment, not a plain link. */
export function AIToolCard({ icon: Icon, title, description, href }: AIToolCardProps) {
  return (
    <HoverCard>
      <div className="flex flex-col gap-3 rounded-xl border bg-gradient-to-br from-primary/5 to-accent/5 p-4 h-full">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Button variant="ai" size="sm" asChild className="self-start">
          <Link href={href}>Open</Link>
        </Button>
      </div>
    </HoverCard>
  );
}
