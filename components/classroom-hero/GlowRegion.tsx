import { cn } from "@/lib/utils";

/**
 * A soft radial highlight used as an InteractiveHotspot's children when
 * there's no glass panel content — just the illustration showing through,
 * lifted with a light glow on hover (via InteractiveHotspot's own
 * transform/brighten treatment) rather than duplicated image pixels.
 */
export function GlowRegion({ shape = "circle", className }: { shape?: "circle" | "rect"; className?: string }) {
  return (
    <div
      className={cn(
        "h-full w-full bg-[radial-gradient(circle,rgb(255_255_255/0.5),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover/hotspot:opacity-100 group-focus-visible/hotspot:opacity-100",
        shape === "circle" ? "rounded-full" : "rounded-xl",
        className
      )}
      aria-hidden="true"
    />
  );
}
