import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialProgress } from "@/components/motion/RadialProgress";

interface ProgressCardProps {
  label: string;
  icon: LucideIcon;
  /** 0-100. Pass null when there's no data yet — shows an honest empty state, not a fake 0%. */
  value: number | null;
  emptyLabel?: string;
}

export function ProgressCard({ label, icon: Icon, value, emptyLabel = "No data yet" }: ProgressCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {value !== null ? (
          <RadialProgress value={value} size={64} strokeWidth={6} label={`${value}%`} />
        ) : (
          <p className="text-sm text-muted-foreground py-4">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
