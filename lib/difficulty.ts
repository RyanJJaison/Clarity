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

export function newDifficultyState(startingDifficulty = 3): DifficultyState {
  return { difficulty: startingDifficulty, streak: 0, masteryScore: 0 };
}

/** Applies one attempt's outcome and returns the updated difficulty state. */
export function recordAttempt(state: DifficultyState, correct: boolean): DifficultyState {
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
    state.masteryScore === 0 && state.streak === 0
      ? correct
        ? 1
        : 0
      : state.masteryScore * (1 - MASTERY_DECAY) + (correct ? 1 : 0) * MASTERY_DECAY;

  return { difficulty, streak: resetStreak, masteryScore };
}
