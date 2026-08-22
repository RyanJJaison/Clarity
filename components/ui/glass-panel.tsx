import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The base glassmorphism surface: translucent background (a color-mixed
 * version of --surface-elevated, so it auto-adapts to light/dark), a
 * subtle light border, one controlled backdrop-blur value, and a soft
 * ambient shadow with an inset top highlight to read as catching light.
 *
 * Use sparingly — glass is a deliberate accent surface (nav, hero panels,
 * overlays, callouts), not a replacement for the default `Card` everywhere.
 */
export function GlassPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-panel"
      className={cn(
        "rounded-2xl border border-[var(--glass-border)] bg-surface-glass shadow-glass backdrop-blur-[var(--glass-blur)]",
        className
      )}
      {...props}
    />
  );
}
