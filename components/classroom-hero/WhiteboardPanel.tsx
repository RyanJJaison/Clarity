import { GlassPanel } from "@/components/ui/glass-panel";
import { InteractiveHotspot } from "./InteractiveHotspot";
import { rectToPositionPercent } from "./backgroundCrop";

interface WhiteboardPanelProps {
  title: string;
  detail: string;
  href: string;
}

const POSITION = rectToPositionPercent({ x: 310, y: 115, w: 600, h: 320 });

/** The whiteboard — Today's Focus. Primary interaction per the enhancement spec (Section 4). */
export function WhiteboardPanel({ title, detail, href }: WhiteboardPanelProps) {
  return (
    <InteractiveHotspot href={href} label={`Whiteboard — Today's Focus: ${title}`} tooltip="TODAY'S FOCUS" position={POSITION}>
      <GlassPanel className="flex h-full w-full flex-col justify-center gap-3 p-8">
        <div className="flex items-center justify-between">
          <p className="font-editorial italic text-[28px] text-foreground leading-tight truncate pr-4">{title}</p>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-subtle shrink-0">Today&apos;s Lesson</p>
        </div>
        <div className="h-px w-full bg-border" />
        <p className="text-sm text-subtle">{detail}</p>
      </GlassPanel>
    </InteractiveHotspot>
  );
}
