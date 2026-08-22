import { RadialProgress } from "@/components/motion/RadialProgress";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

export interface MasteryRow {
  concept_tag: string;
  mastery_score: number;
}

// Radial gauges, not flat bars: mastery is a per-concept KPI, and a ring lets
// several concepts be compared at a glance (ui-ux-pro-max chart guidance).
export function MasteryChart({ mastery }: { mastery: MasteryRow[] }) {
  if (mastery.length === 0) {
    return <p className="text-sm text-muted-foreground">No concepts tracked yet — take a quiz to get started.</p>;
  }

  const sorted = [...mastery].sort((a, b) => a.mastery_score - b.mastery_score);

  return (
    <StaggerGroup className="flex flex-wrap gap-6">
      {sorted.map((row) => (
        <StaggerItem key={row.concept_tag}>
          <RadialProgress
            value={row.mastery_score * 100}
            label={`${Math.round(row.mastery_score * 100)}%`}
            sublabel={row.concept_tag}
            colorClassName={
              row.mastery_score < 0.4 ? "stroke-destructive" : row.mastery_score < 0.75 ? "stroke-accent" : "stroke-primary"
            }
          />
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
