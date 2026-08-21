export interface SrsCardState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface SrsReviewResult extends SrsCardState {
  dueDate: string; // YYYY-MM-DD
}

/**
 * SM-2 spaced repetition. `grade` is 0-5 (0 = total blackout, 5 = perfect
 * recall). Callers derive grade from correct/incorrect + confidence.
 */
export function reviewCard(
  state: SrsCardState,
  grade: number,
  today: Date = new Date()
): SrsReviewResult {
  if (grade < 0 || grade > 5 || !Number.isFinite(grade)) {
    throw new Error(`grade must be between 0 and 5, got ${grade}`);
  }

  let { easeFactor, intervalDays, repetitions } = state;

  if (grade < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  );

  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + intervalDays);

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueDate: dueDate.toISOString().slice(0, 10),
  };
}

export function newCardState(): SrsCardState {
  return { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };
}

/** Maps a correct/incorrect result to an SM-2 grade (0-5). */
export function gradeFromOutcome(correct: boolean, confident: boolean): number {
  if (correct) return confident ? 5 : 4;
  return confident ? 2 : 0;
}
