export function examReadinessSystemPrompt() {
  return `Given a learner's recent quiz attempts (accuracy per concept, trend over time)
and days remaining until the exam, estimate a readiness score 0-100 and list
the 3 weakest concepts to prioritize. Return ONLY valid JSON:
{ "readinessScore": number, "weakConcepts": string[], "rationale": string }`;
}

export function examReadinessUserPrompt(params: {
  daysRemaining: number;
  accuracyByConceptJson: string;
}) {
  return `Days remaining until exam: ${params.daysRemaining}\n\nAccuracy per concept (JSON):\n${params.accuracyByConceptJson}`;
}
