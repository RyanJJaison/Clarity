import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Semantic typography building blocks, backed by the --text-* scale in
 * app/globals.css. Prefer these over ad hoc text-size/font-weight class
 * combinations so heading/body rhythm stays consistent app-wide.
 */

export function Display({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 className={cn("text-display font-heading font-semibold tracking-tight", className)} {...props} />;
}

export function H1({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 className={cn("text-h1 font-heading font-semibold tracking-tight", className)} {...props} />;
}

export function H2({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-h2 font-heading font-semibold tracking-tight", className)} {...props} />;
}

export function H3({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-h3 font-heading font-semibold", className)} {...props} />;
}

export function H4({ className, ...props }: React.ComponentProps<"h4">) {
  return <h4 className={cn("text-h4 font-heading font-semibold", className)} {...props} />;
}

export function Body({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-body font-sans text-foreground", className)} {...props} />;
}

export function BodySmall({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-body-small font-sans text-foreground", className)} {...props} />;
}

export function Caption({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("text-caption font-sans text-muted-foreground", className)} {...props} />;
}

/**
 * Small uppercase-weight label/eyebrow text (the "label" tier of the type
 * scale). Named `LabelText` rather than `Label` to avoid colliding with the
 * form-field `Label` in components/ui/label.tsx (Radix Label, a different
 * concept) — a form that needs both can import both without a clash.
 */
export function LabelText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={cn("text-label font-sans font-medium tracking-wide text-subtle", className)} {...props} />
  );
}
