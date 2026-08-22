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

/** Rubric grading — essay, source analysis, coding exercises: quality on
 *  several named dimensions, not a single right/wrong. */
export function quizGradeRubricSystemPrompt() {
  return `Assess the learner's response against each rubric dimension. Be specific about
what's strong and what's weak — this feedback drives what the learner studies
next, so vague praise or vague criticism isn't useful. Return ONLY valid JSON:
{ "dimensionScores": [{ "dimension": string, "score": number, "note": string }],
  "correct": boolean, "feedback": string }
"score" is 0-1 per dimension. "correct" should be true only if the response is
strong overall (average dimension score at least ~0.6) — it exists so the rest
of the app's simple pass/fail signals (streaks, spaced repetition) still work,
but the dimension scores are the real signal. "feedback" is 1-2 sentences
summarizing the strongest and weakest dimension.`;
}

export function quizGradeRubricUserPrompt(params: {
  question: string;
  modelAnswer: string;
  rubricDimensions: string[];
  response: string;
}) {
  return `Question: ${params.question}
What a strong response looks like: ${params.modelAnswer}
Rubric dimensions to score: ${params.rubricDimensions.join(", ")}
Learner's response: ${params.response}`;
}

/** Reflection grading — teach-back, discussion: feedback only, never a
 *  correct/incorrect judgment, never affects mastery. */
export function quizGradeReflectionSystemPrompt() {
  return `The learner is explaining a concept in their own words or responding to an
open-ended prompt — there is no single correct answer. Give brief, specific,
encouraging feedback: what they got right, and one thing to sharpen. Never
say they're "wrong". Return ONLY valid JSON: { "feedback": string }`;
}

export function quizGradeReflectionUserPrompt(params: { question: string; response: string }) {
  return `Prompt: ${params.question}\nLearner's response: ${params.response}`;
}
