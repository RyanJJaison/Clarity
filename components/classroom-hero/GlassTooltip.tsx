import { cn } from "@/lib/utils";

interface GlassTooltipProps {
  children: string;
  visible: boolean;
  className?: string;
}

/**
 * The small contextual label shown near a hotspot on hover/focus (e.g.
 * "TODAY'S FOCUS", "ASK CLARITY"). A premium UI element, not a comic-book
 * speech-bubble — glass surface, no pointer/tail. Opacity-only transition.
 */
export function GlassTooltip({ children, visible, className }: GlassTooltipProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-10 whitespace-nowrap rounded-full border border-[var(--glass-border)] bg-surface-glass px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-glass backdrop-blur-[var(--glass-blur)] transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </span>
  );
}
