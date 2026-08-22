import { SparklesIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { InteractiveHotspot } from "./InteractiveHotspot";
import { rectToPositionPercent } from "./backgroundCrop";
import { openCommandPalette } from "@/components/navigation/CommandPalette";

const POSITION = rectToPositionPercent({ x: 380, y: 808, w: 680, h: 64 });

/**
 * "Ask Clarity anything…" — represents Section 5's Computer/AI Tutor
 * hotspot functionally (no literal computer object exists in this Figma
 * illustration — see implementation notes). Opens the real Command
 * Palette, which already resolves to the tutor chat / real actions.
 */
export function AskClarityBar() {
  return (
    <InteractiveHotspot onActivate={openCommandPalette} label="Ask Clarity — open AI tools" tooltip="ASK CLARITY" position={POSITION}>
      <GlassPanel className="flex h-full w-full items-center gap-4 rounded-[32px] px-6">
        <SparklesIcon className="size-6 shrink-0 text-primary" aria-hidden="true" />
        <span className="flex-1 truncate text-left text-[16px] text-subtle">
          Ask Clarity anything… e.g. &quot;Explain this in simple terms&quot;
        </span>
        <span className="shrink-0 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background">
          Ask AI
        </span>
      </GlassPanel>
    </InteractiveHotspot>
  );
}
