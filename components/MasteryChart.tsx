import { Progress } from "@/components/ui/progress";

export interface MasteryRow {
  concept_tag: string;
  mastery_score: number;
}

export function MasteryChart({ mastery }: { mastery: MasteryRow[] }) {
  if (mastery.length === 0) {
    return <p className="text-sm text-muted-foreground">No concepts tracked yet — take a quiz to get started.</p>;
  }

  const sorted = [...mastery].sort((a, b) => a.mastery_score - b.mastery_score);

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((row) => (
        <div key={row.concept_tag} className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span>{row.concept_tag}</span>
            <span className="text-muted-foreground">{Math.round(row.mastery_score * 100)}%</span>
          </div>
          <Progress value={row.mastery_score * 100} />
        </div>
      ))}
    </div>
  );
}
