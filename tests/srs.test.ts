import { describe, expect, it } from "vitest";
import { gradeFromOutcome, newCardState, reviewCard } from "@/lib/srs";

describe("reviewCard", () => {
  it("follows the SM-2 interval progression on consecutive good grades", () => {
    const today = new Date("2026-01-01T00:00:00Z");
    const state = newCardState();

    const r1 = reviewCard(state, 5, today);
    expect(r1.repetitions).toBe(1);
    expect(r1.intervalDays).toBe(1);

    const r2 = reviewCard(r1, 5, today);
    expect(r2.repetitions).toBe(2);
    expect(r2.intervalDays).toBe(6);

    const r3 = reviewCard(r2, 5, today);
    expect(r3.repetitions).toBe(3);
    expect(r3.intervalDays).toBe(Math.round(6 * r2.easeFactor));
  });

  it("resets repetitions and interval to 1 on a failing grade", () => {
    const today = new Date("2026-01-01T00:00:00Z");
    const state = { easeFactor: 2.5, intervalDays: 6, repetitions: 2 };

    const result = reviewCard(state, 1, today);

    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
  });

  it("never lets ease factor drop below 1.3", () => {
    const today = new Date("2026-01-01T00:00:00Z");
    let state = newCardState();
    for (let i = 0; i < 10; i++) {
      state = reviewCard(state, 0, today);
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("rejects an out-of-range grade", () => {
    expect(() => reviewCard(newCardState(), 6)).toThrow();
    expect(() => reviewCard(newCardState(), -1)).toThrow();
  });
});

describe("gradeFromOutcome", () => {
  it("maps correct/confident to the top grade", () => {
    expect(gradeFromOutcome(true, true)).toBe(5);
  });

  it("maps incorrect/confident to a low but non-zero grade", () => {
    expect(gradeFromOutcome(false, true)).toBe(2);
  });
});
