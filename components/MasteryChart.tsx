import { RadialProgress } from "@/components/motion/RadialProgress";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

export interface MasteryRow {
  concept_tag: string;
  dimension: string;
  mastery_score: number;
}

// Radial gauges, not flat bars: mastery is a per-concept KPI, and a ring lets
// several concepts be compared at a glance (ui-ux-pro-max chart guidance).
// A concept can appear more than once if it's been assessed on more than one
// rubric dimension (e.g. "The Cold War · analysis" alongside the plain
// "The Cold War" recall gauge) — the sublabel makes the distinction explicit.
export function MasteryChart({ mastery }: { mastery: MasteryRow[] }) {
  if (mastery.length === 0) {
    return <p className="text-sm text-muted-foreground">No concepts tracked yet — take a quiz to get started.</p>;
  }

  const sorted = [...mastery].sort((a, b) => a.mastery_score - b.mastery_score);

  return (
    <StaggerGroup className="flex flex-wrap gap-6">
      {sorted.map((row) => (
        <StaggerItem key={`${row.concept_tag}:${row.dimension}`}>
          <RadialProgress
            value={row.mastery_score * 100}
            label={`${Math.round(row.mastery_score * 100)}%`}
            sublabel={row.dimension === "overall" ? row.concept_tag : `${row.concept_tag} · ${row.dimension}`}
            colorClassName={
              row.mastery_score < 0.4 ? "stroke-destructive" : row.mastery_score < 0.75 ? "stroke-accent" : "stroke-primary"
            }
          />
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
