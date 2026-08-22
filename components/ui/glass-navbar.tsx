import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky, translucent top navigation surface. Not wired into any layout
 * yet — this is the reusable primitive; pages opt in explicitly.
 */
export function GlassNavbar({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="glass-navbar"
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] border-b border-[var(--glass-border)] bg-surface-glass backdrop-blur-[var(--glass-blur)]",
        className
      )}
      {...props}
    />
  );
}
