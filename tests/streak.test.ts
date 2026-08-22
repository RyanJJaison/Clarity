import { describe, expect, it } from "vitest";
import { computeStreak } from "@/lib/streak";

describe("computeStreak", () => {
  it("returns 0 for no activity", () => {
    expect(computeStreak([])).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const today = new Date("2026-01-10T12:00:00Z");
    const timestamps = [
      "2026-01-10T09:00:00Z",
      "2026-01-09T09:00:00Z",
      "2026-01-08T09:00:00Z",
      "2026-01-05T09:00:00Z", // gap — should not extend the streak
    ];
    expect(computeStreak(timestamps, today)).toBe(3);
  });

  it("returns 0 if today has no activity, even with a recent streak", () => {
    const today = new Date("2026-01-10T12:00:00Z");
    const timestamps = ["2026-01-09T09:00:00Z", "2026-01-08T09:00:00Z"];
    expect(computeStreak(timestamps, today)).toBe(0);
  });
});
