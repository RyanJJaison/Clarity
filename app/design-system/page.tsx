"use client";

import { useState } from "react";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassNavbar } from "@/components/ui/glass-navbar";
import {
  GlassModal,
  GlassModalTrigger,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalDescription,
  GlassModalFooter,
  GlassModalClose,
} from "@/components/ui/glass-modal";
import { Display, H1, H2, H3, H4, Body, BodySmall, Caption, LabelText } from "@/components/ui/typography";
import { ThemeToggle } from "@/components/theme-toggle";

const COLOR_SWATCHES: { name: string; className: string; textClassName?: string }[] = [
  { name: "background", className: "bg-background border" },
  { name: "surface", className: "bg-surface border" },
  { name: "surface-elevated", className: "bg-surface-elevated border" },
  { name: "surface-glass", className: "bg-surface-glass border backdrop-blur-[var(--glass-blur)]" },
  { name: "primary", className: "bg-primary", textClassName: "text-primary-foreground" },
  { name: "secondary", className: "bg-secondary", textClassName: "text-secondary-foreground" },
  { name: "accent", className: "bg-accent", textClassName: "text-accent-foreground" },
  { name: "success", className: "bg-success", textClassName: "text-success-foreground" },
  { name: "warning", className: "bg-warning", textClassName: "text-warning-foreground" },
  { name: "error", className: "bg-error", textClassName: "text-error-foreground" },
];

const BUTTON_VARIANTS = ["default", "secondary", "ghost", "glass", "destructive", "ai"] as const;
const BUTTON_LABELS: Record<(typeof BUTTON_VARIANTS)[number], string> = {
  default: "Primary",
  secondary: "Secondary",
  ghost: "Ghost",
  glass: "Glass",
  destructive: "Danger",
  ai: "AI",
};

export default function DesignSystemPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-full">
      <GlassNavbar className="px-6 py-4 flex items-center justify-between">
        <span className="font-heading font-semibold">Clarity Design System</span>
        <ThemeToggle />
      </GlassNavbar>

      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-16">
        {/* Typography ------------------------------------------------- */}
        <section className="flex flex-col gap-4">
          <LabelText>Typography</LabelText>
          <div className="flex flex-col gap-3">
            <Display>Display heading</Display>
            <H1>H1 heading</H1>
            <H2>H2 heading</H2>
            <H3>H3 heading</H3>
            <H4>H4 heading</H4>
            <Body>Body text — the default paragraph size, tuned for comfortable reading at 1.6 line-height.</Body>
            <BodySmall>Body small — secondary copy, captions inside dense UI.</BodySmall>
            <Caption>Caption — timestamps, metadata, fine print.</Caption>
            <LabelText>Label — form labels, eyebrows, tags</LabelText>
          </div>
        </section>

        {/* Colors ------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <LabelText>Colors</LabelText>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {COLOR_SWATCHES.map((swatch) => (
              <div key={swatch.name} className="flex flex-col gap-2">
                <div
                  className={`h-16 rounded-xl flex items-end p-2 ${swatch.className}`}
                >
                  <span className={`text-xs font-medium ${swatch.textClassName ?? "text-foreground"}`}>
                    {swatch.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-foreground">text-primary (foreground)</span>
            <span className="text-subtle">text-secondary (subtle)</span>
            <span className="text-muted-foreground">text-muted</span>
          </div>
        </section>

        {/* Shadows / elevation ------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <LabelText>Elevation</LabelText>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
            <div className="h-16 rounded-xl bg-surface-elevated shadow-xs flex items-center justify-center text-xs">shadow-xs</div>
            <div className="h-16 rounded-xl bg-surface-elevated shadow-sm flex items-center justify-center text-xs">shadow-sm</div>
            <div className="h-16 rounded-xl bg-surface-elevated shadow-md flex items-center justify-center text-xs">shadow-md</div>
            <div className="h-16 rounded-xl bg-surface-elevated shadow-lg flex items-center justify-center text-xs">shadow-lg</div>
            <div className="h-16 rounded-xl bg-surface-elevated shadow-xl flex items-center justify-center text-xs">shadow-xl</div>
          </div>
        </section>

        {/* Buttons ------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <LabelText>Buttons</LabelText>
          <div className="flex flex-wrap gap-3">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant === "ai" && <SparklesIcon />}
                {BUTTON_LABELS[variant]}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button disabled>Disabled</Button>
            <Button loading={loading} onClick={() => setLoading((v) => !v)}>
              {loading ? "Loading…" : "Click to toggle loading"}
            </Button>
          </div>
        </section>

        {/* Shape --------------------------------------------------------- */}
        <section className="flex flex-col gap-4">
          <LabelText>Shape</LabelText>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-4">
            <div className="h-16 bg-muted rounded-sm flex items-center justify-center text-xs">sm</div>
            <div className="h-16 bg-muted rounded-md flex items-center justify-center text-xs">md</div>
            <div className="h-16 bg-muted rounded-lg flex items-center justify-center text-xs">lg</div>
            <div className="h-16 bg-muted rounded-xl flex items-center justify-center text-xs">xl</div>
            <div className="h-16 bg-muted rounded-2xl flex items-center justify-center text-xs">2xl</div>
            <div className="h-16 bg-muted rounded-3xl flex items-center justify-center text-xs">3xl</div>
            <div className="h-16 bg-muted rounded-4xl flex items-center justify-center text-xs">4xl</div>
          </div>
        </section>

        {/* Glass surfaces -------------------------------------------------- */}
        <section className="flex flex-col gap-4">
          <LabelText>Glass surfaces</LabelText>
          <div className="relative rounded-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/20 p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              <GlassPanel className="p-4">
                <Body className="font-medium">GlassPanel</Body>
                <BodySmall className="text-muted-foreground">Base translucent surface for callouts and overlays.</BodySmall>
              </GlassPanel>
              <GlassCard>
                <CardHeader>
                  <CardTitle>GlassCard</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Same slot structure as Card — header/content/footer — glass surface.
                </CardContent>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Glass modal ------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <LabelText>Glass modal</LabelText>
          <GlassModal>
            <GlassModalTrigger asChild>
              <Button variant="outline" className="self-start">
                Open glass modal
              </Button>
            </GlassModalTrigger>
            <GlassModalContent>
              <GlassModalHeader>
                <GlassModalTitle>Glass modal</GlassModalTitle>
                <GlassModalDescription>
                  Built on the existing Radix Dialog — same accessible focus-trap and ESC behavior, glass surface.
                </GlassModalDescription>
              </GlassModalHeader>
              <GlassModalFooter>
                <GlassModalClose asChild>
                  <Button variant="outline">Close</Button>
                </GlassModalClose>
              </GlassModalFooter>
            </GlassModalContent>
          </GlassModal>
        </section>

        {/* Reference card for comparison ------------------------------------ */}
        <section className="flex flex-col gap-4">
          <LabelText>Standard card (for comparison — not glass)</LabelText>
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Standard surface</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Most of the app should use this — opaque surface, no blur. Glass is the accent, not the default.
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
