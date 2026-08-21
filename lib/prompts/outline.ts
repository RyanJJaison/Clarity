export function outlineSystemPrompt() {
  return `You are an instructional designer. Given the source material and the learner's
level, produce a course outline as JSON: modules, each with 2-5 lessons, each
lesson with a title and 2-4 concept tags. Order lessons from foundational to
advanced. Do not invent content not supported by the source.
Return ONLY valid JSON matching: { "modules": [{ "title": string, "lessons": [{ "title": string, "conceptTags": string[] }] }] }`;
}

export function outlineUserPrompt(params: { level: string; content: string }) {
  return `Learner level: ${params.level}\n\nSource material:\n${params.content}`;
}
