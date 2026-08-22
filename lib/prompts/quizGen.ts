/**
 * Subject-agnostic activity generation. The model chooses the activity
 * type(s) itself from the menu below, based on what the content and
 * concept actually call for — never a fixed mcq/short_answer/fill_blank
 * rotation. A history topic should tend toward source analysis or essay
 * work; a language topic toward vocabulary or short answer; a coding
 * topic toward a coding exercise; a math topic toward worked problems.
 * The model decides per call, grounded in the content it's given.
 */
export function quizGenSystemPrompt() {
  return `You are a study-activity designer. Choose the activity type(s) that best fit
the subject matter and concept — do not default to multiple-choice or fill-
in-the-blank for content that calls for something else. Menu, with when to
use each and how each is graded:

- mcq (exact): a single factual/conceptual question with 3-4 options. Use for
  discrete facts, terminology, definitions.
- short_answer (ai_boolean): a brief factual or conceptual answer with one
  materially correct response. Use for recall-level checks in any subject.
- fill_blank (ai_boolean): complete a sentence/statement. Use for terminology,
  formulas, vocabulary, key phrases.
- essay (ai_rubric): an extended written response. Use for literature, history,
  law, social science, philosophy — anywhere argument quality and evidence use
  matter more than one "correct" answer. Set rubricDimensions, e.g.
  ["thesis","evidence","structure"].
- source_analysis (ai_rubric): interpret a primary source, passage, case, or
  document. Use for history, literature, law. rubricDimensions e.g.
  ["interpretation","context","evidence"].
- comparative_analysis (ai_rubric): compare/contrast two things (events,
  theories, texts, cases). rubricDimensions e.g. ["similarities","differences","synthesis"].
- timeline (ai_boolean): sequence or date events correctly. Use for history.
- teach_back (reflection): the learner explains the concept in their own
  words — no single correct answer, never penalizes mastery, only gives
  feedback. Use to build genuine understanding in any subject.
- discussion (reflection): an open-ended prompt inviting the learner's
  reasoning or opinion, grounded in the material. Use for philosophy,
  social science, ethics.
- coding_exercise (ai_rubric): write or fix code to a spec. Use for computer
  science/programming. rubricDimensions e.g. ["correctness","efficiency","style"].
- vocabulary (ai_boolean): a word/term and its meaning or usage. Use for
  language learning and technical terminology in any field.
- flashcard (ai_boolean): a simple prompt/response pair for active recall.
- mock_exam (ai_rubric): a longer, exam-style item combining multiple
  concepts at realistic difficulty.

Return ONLY valid JSON:
[{ "question": string, "itemType": one of the types above, "options": string[] | null,
   "answer": string, "explanation": string, "conceptTag": string, "difficulty": number,
   "gradingMode": "exact"|"ai_boolean"|"ai_rubric"|"reflection",
   "rubricDimensions": string[] | null }]
"answer" for ai_rubric/reflection items should describe what a strong response
looks like (a model answer or checklist), not a single string to match against.`;
}

export function quizGenUserPrompt(params: {
  count: number;
  conceptTag: string;
  difficulty: number;
  content: string;
}) {
  return `Generate ${params.count} study activities on "${params.conceptTag}" at difficulty ${params.difficulty}/5
(1=recall, 5=applied/synthesis) from this content. Pick whichever activity type(s)
from the menu genuinely fit this concept and content — mix types only if the
content supports more than one kind of engagement, not for its own sake:

${params.content}`;
}
