import type { LucideIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HoverCard } from "@/components/motion/HoverCard";
import { rectToPositionPercent, type PixelRect } from "./backgroundCrop";

interface StatCardProps {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: number;
  suffix?: string;
  position: PixelRect;
}

/** Generic icon-chip + label + value card — reused for Streak and Due-for-review. */
export function StatCard({ icon: Icon, iconClassName, label, value, suffix = "", position }: StatCardProps) {
  return (
    <div className="absolute" style={rectToPositionPercent(position)}>
      <HoverCard className="h-full">
        <GlassPanel className="flex h-full flex-col gap-2 p-4">
          <div className="flex items-center gap-2.5">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconClassName ?? "bg-primary/10 text-primary"}`}>
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <p className="text-[13px] font-bold uppercase text-subtle">{label}</p>
          </div>
          <p className="font-heading text-[28px] font-extrabold text-foreground">
            <AnimatedNumber value={value} suffix={suffix} />
          </p>
        </GlassPanel>
      </HoverCard>
    </div>
  );
}
