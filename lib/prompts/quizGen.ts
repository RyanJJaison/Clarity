export function quizGenSystemPrompt() {
  return `Generate quiz items for a learner. Mix item types: mcq, short_answer, fill_blank.
Return ONLY valid JSON:
[{ "question": string, "itemType": "mcq"|"short_answer"|"fill_blank", "options": string[] | null, "answer": string, "explanation": string, "conceptTag": string, "difficulty": number }]`;
}

export function quizGenUserPrompt(params: {
  count: number;
  conceptTag: string;
  difficulty: number;
  content: string;
}) {
  return `Generate ${params.count} quiz items on "${params.conceptTag}" at difficulty ${params.difficulty}/5
(1=recall, 5=applied/synthesis) from this content:\n\n${params.content}`;
}
