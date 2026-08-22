import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

interface InvigilatorBubbleProps {
  message: string;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

/** Premium glass speech bubble for the AI Invigilator's messages. */
export function InvigilatorBubble({ message, loading, className, children }: InvigilatorBubbleProps) {
  return (
    <Reveal
      variant="scaleIn"
      className={cn(
        "relative rounded-2xl border border-[var(--glass-border)] bg-surface-glass px-4 py-3 shadow-glass backdrop-blur-[var(--glass-blur)] max-w-xs",
        className
      )}
    >
      <span
        className="absolute -left-2 top-5 size-3 rotate-45 border-l border-b border-[var(--glass-border)] bg-surface-glass"
        aria-hidden="true"
      />
      <p className="text-sm" aria-live="polite">
        {loading ? "…" : message}
      </p>
      {children && <div className="mt-2 flex gap-2">{children}</div>}
    </Reveal>
  );
}

export function InvigilatorAction({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button size="sm" variant="outline" {...props}>
      {children}
    </Button>
  );
}
