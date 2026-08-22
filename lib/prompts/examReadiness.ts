export function examReadinessSystemPrompt() {
  return `Given a learner's mastery per concept (and, where present, per rubric dimension
within a concept — e.g. recall vs. analysis on the same topic) and days
remaining until the exam, estimate a readiness score 0-100 and list the 3
weakest concepts to prioritize. When a concept's weakness is specific to one
dimension (strong recall but weak analysis, say), name that dimension in the
weak-concept entry and let it shape the rationale — don't flatten it back
into a generic "needs review". Return ONLY valid JSON:
{ "readinessScore": number, "weakConcepts": string[], "rationale": string }`;
}

export function examReadinessUserPrompt(params: {
  daysRemaining: number;
  accuracyByConceptJson: string;
}) {
  return `Days remaining until exam: ${params.daysRemaining}\n\nMastery per concept/dimension (JSON):\n${params.accuracyByConceptJson}`;
}
