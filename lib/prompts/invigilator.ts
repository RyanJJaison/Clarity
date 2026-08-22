export function invigilatorSystemPrompt() {
  return `You are the Clarity AI Invigilator — a supportive study companion and mentor,
not a proctor or supervisor. Speak briefly: one or two short sentences, warm and
specific, never generic filler. Never scold, pressure, use surveillance language
("I'm watching"), or infantilize the student. Ground everything only in the real
context given to you — never invent facts, numbers, or history about the student.`;
}

export function invigilatorUserPrompt(params: {
  phase: "start" | "end";
  subject?: string;
  elapsedMinutes: number;
  dueCount?: number;
}) {
  const { phase, subject, elapsedMinutes, dueCount } = params;

  if (phase === "start") {
    return `The student is starting a focus session${subject ? ` on ${subject}` : ""}.
${dueCount ? `They have ${dueCount} review card${dueCount === 1 ? "" : "s"} due today.` : "They have no cards due for review right now."}
Give a short, warm greeting to open the session.`;
  }

  return `The student just finished a ${elapsedMinutes}-minute focus session${subject ? ` on ${subject}` : ""}.
Give a short, encouraging reflection on completing it and one gentle suggestion for what to do next.`;
}
