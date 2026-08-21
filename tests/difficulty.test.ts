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
});
