export function quizGradeSystemPrompt() {
  return `Judge whether the learner's response is substantively correct, even if
worded differently. Return ONLY valid JSON: { "correct": boolean, "feedback": string }
Feedback should be one sentence, specific, and kind.`;
}

export function quizGradeUserPrompt(params: {
  question: string;
  answer: string;
  response: string;
}) {
  return `Question: ${params.question}\nExpected answer: ${params.answer}\nLearner's response: ${params.response}`;
}
