import { describe, expect, it } from "vitest";
import { newDifficultyState, recordAttempt } from "@/lib/difficulty";

describe("recordAttempt", () => {
  it("levels up difficulty after 3 correct answers in a row", () => {
    let state = newDifficultyState(3);
    state = recordAttempt(state, true);
    state = recordAttempt(state, true);
    expect(state.difficulty).toBe(3); // not yet, only 2 in a row
    state = recordAttempt(state, true);
    expect(state.difficulty).toBe(4);
    expect(state.streak).toBe(0); // streak resets after leveling up
  });

  it("levels down difficulty after 2 incorrect answers in a row", () => {
    let state = newDifficultyState(3);
    state = recordAttempt(state, false);
    expect(state.difficulty).toBe(3);
    state = recordAttempt(state, false);
    expect(state.difficulty).toBe(2);
    expect(state.streak).toBe(0);
  });

  it("caps difficulty at 5 and floors it at 1", () => {
    let state = newDifficultyState(5);
    for (let i = 0; i < 6; i++) state = recordAttempt(state, true);
    expect(state.difficulty).toBe(5);

    state = newDifficultyState(1);
    for (let i = 0; i < 6; i++) state = recordAttempt(state, false);
    expect(state.difficulty).toBe(1);
  });

  it("tracks mastery score as a rolling accuracy that moves toward recent outcomes", () => {
    let state = newDifficultyState();
    for (let i = 0; i < 5; i++) state = recordAttempt(state, true);
    expect(state.masteryScore).toBeGreaterThan(0.9);

    state = recordAttempt(state, false);
    expect(state.masteryScore).toBeLessThan(0.9);
  });

  it("accepts a continuous 0-1 rubric score at full precision, not flattened to 0/1", () => {
    let state = newDifficultyState();
    state = recordAttempt(state, 0.75);
    expect(state.masteryScore).toBe(0.75); // cold start: takes the score directly

    state = recordAttempt(state, 0.5);
    // blended, not just averaged with a rounded 0/1
    expect(state.masteryScore).toBeCloseTo(0.75 * 0.7 + 0.5 * 0.3, 5);
  });

  it("treats a rubric score at/above the pass threshold as 'correct' for streak/leveling", () => {
    let state = newDifficultyState(3);
    state = recordAttempt(state, 0.8);
    state = recordAttempt(state, 0.65);
    state = recordAttempt(state, 0.9);
    expect(state.difficulty).toBe(4); // three passing scores in a row levels up, same as three `true`s
  });

  it("treats a rubric score below the pass threshold as 'incorrect' for streak/leveling", () => {
    let state = newDifficultyState(3);
    state = recordAttempt(state, 0.3);
    state = recordAttempt(state, 0.1);
    expect(state.difficulty).toBe(2); // two failing scores in a row levels down, same as two `false`s
  });
});
