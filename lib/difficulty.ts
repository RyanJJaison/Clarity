export interface DifficultyState {
  difficulty: number; // 1-5
  streak: number; // positive = correct streak, negative = incorrect streak
  masteryScore: number; // 0..1, exponentially-weighted rolling accuracy
}

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;
const CORRECT_STREAK_TO_LEVEL_UP = 3;
const INCORRECT_STREAK_TO_LEVEL_DOWN = 2;
const MASTERY_DECAY = 0.3; // weight given to the newest attempt
const RUBRIC_PASS_THRESHOLD = 0.6; // continuous score treated as "correct" for streak/leveling

/**
 * A pass/fail outcome (mcq, short_answer, fill_blank, timeline, vocabulary,
 * flashcard) or a continuous rubric score 0-1 (essay, source_analysis,
 * comparative_analysis, coding_exercise — see lib/prompts/quizGrade.ts).
 * Continuous scores feed the mastery EWMA at full precision instead of
 * being flattened to 0/1; streak/leveling still needs a boolean, derived
 * via RUBRIC_PASS_THRESHOLD.
 */
export type AttemptOutcome = boolean | number;

function toBoolean(outcome: AttemptOutcome): boolean {
  return typeof outcome === "boolean" ? outcome : outcome >= RUBRIC_PASS_THRESHOLD;
}

function toScore(outcome: AttemptOutcome): number {
  return typeof outcome === "boolean" ? (outcome ? 1 : 0) : outcome;
}

export function newDifficultyState(startingDifficulty = 3): DifficultyState {
  return { difficulty: startingDifficulty, streak: 0, masteryScore: 0 };
}

/** Applies one attempt's outcome and returns the updated difficulty state. */
export function recordAttempt(state: DifficultyState, outcome: AttemptOutcome): DifficultyState {
  const correct = toBoolean(outcome);
  const score = toScore(outcome);

  const streak = correct
    ? state.streak > 0
      ? state.streak + 1
      : 1
    : state.streak < 0
      ? state.streak - 1
      : -1;

  let difficulty = state.difficulty;
  let resetStreak = streak;

  if (correct && streak >= CORRECT_STREAK_TO_LEVEL_UP) {
    difficulty = Math.min(MAX_DIFFICULTY, difficulty + 1);
    resetStreak = 0;
  } else if (!correct && streak <= -INCORRECT_STREAK_TO_LEVEL_DOWN) {
    difficulty = Math.max(MIN_DIFFICULTY, difficulty - 1);
    resetStreak = 0;
  }

  const masteryScore =
    state.masteryScore === 0 && state.streak === 0 ? score : state.masteryScore * (1 - MASTERY_DECAY) + score * MASTERY_DECAY;

  return { difficulty, streak: resetStreak, masteryScore };
}
