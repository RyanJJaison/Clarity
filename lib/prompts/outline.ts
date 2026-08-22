export function outlineSystemPrompt() {
  return `You are an instructional designer. Given the source material and the learner's
level, produce a course outline as JSON: modules, each with 2-5 lessons, each
lesson with a title and 2-4 concept tags. Order lessons from foundational to
advanced. Do not invent content not supported by the source. If a deadline is
given and time is short relative to the material's size, prioritize
accordingly: sequence higher-weight/foundational topics earlier and note in
a lesson's title or concept tags when a topic is large or exam-critical, so
the study plan built from this outline can prioritize it.
Return ONLY valid JSON matching: { "modules": [{ "title": string, "lessons": [{ "title": string, "conceptTags": string[] }] }] }`;
}

export function outlineUserPrompt(params: { level: string; content: string; daysRemaining?: number }) {
  const deadline =
    params.daysRemaining !== undefined ? `\n\nDays remaining until the exam/deadline: ${params.daysRemaining}` : "";
  return `Learner level: ${params.level}${deadline}\n\nSource material:\n${params.content}`;
}
