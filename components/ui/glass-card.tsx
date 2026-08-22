import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Card, restyled with the glass surface treatment. Compose with the usual
 * CardHeader/CardTitle/CardContent/CardFooter — only the outer surface
 * changes. Use for content that should feel "floating" (highlighted
 * callouts, featured stats) — not as the default card everywhere.
 */
export function GlassCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "border ring-0 border-[var(--glass-border)] bg-surface-glass shadow-glass backdrop-blur-[var(--glass-blur)]",
        className
      )}
      {...props}
    />
  );
}
