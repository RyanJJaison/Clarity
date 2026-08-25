import { describe, expect, it } from "vitest";
import {
  buildContinueLearning,
  buildRecentActivity,
  buildRecommendations,
  buildTodaysFocus,
  buildUpcomingDeadlines,
  courseProgress,
  hasRecentActivity,
  mostActiveCourseId,
  quizAccuracy,
} from "@/lib/dashboard-data";

describe("buildRecentActivity", () => {
  it("merges quiz and chat activity sorted by recency", () => {
    const attempts = [
      { id: "a1", created_at: "2026-01-01T10:00:00Z", correct: true, question: "What is x?", course_id: "c1" },
    ];
    const chats = [
      { id: "m1", created_at: "2026-01-02T10:00:00Z", content: "Explain vectors", course_id: "c1" },
    ];
    const result = buildRecentActivity(attempts, chats);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("chat"); // more recent
    expect(result[1].type).toBe("quiz");
  });

  it("respects the limit", () => {
    const attempts = Array.from({ length: 10 }, (_, i) => ({
      id: `a${i}`,
      created_at: `2026-01-01T${String(i).padStart(2, "0")}:00:00Z`,
      correct: true,
      question: "Q",
      course_id: "c1",
    }));
    expect(buildRecentActivity(attempts, [], 3)).toHaveLength(3);
  });
});

describe("courseProgress", () => {
  it("averages mastery scores per course", () => {
    const mastery = [
      { course_id: "c1", concept_tag: "a", dimension: "overall", mastery_score: 0.8 },
      { course_id: "c1", concept_tag: "b", dimension: "overall", mastery_score: 0.4 },
      { course_id: "c2", concept_tag: "c", dimension: "overall", mastery_score: 1 },
    ];
    const result = courseProgress(mastery);
    expect(result.get("c1")).toBeCloseTo(0.6);
    expect(result.get("c2")).toBe(1);
  });
});

describe("mostActiveCourseId", () => {
  it("returns the most recent activity's course", () => {
    const activity = [{ id: "1", type: "quiz" as const, createdAt: "x", courseId: "c1", summary: "" }];
    expect(mostActiveCourseId(activity, "fallback")).toBe("c1");
  });

  it("falls back when there's no activity", () => {
    expect(mostActiveCourseId([], "fallback")).toBe("fallback");
  });
});

describe("hasRecentActivity", () => {
  it("is true within the window", () => {
    const now = new Date("2026-01-10T00:00:00Z");
    const activity = [{ id: "1", type: "quiz" as const, createdAt: "2026-01-09T00:00:00Z", courseId: "c1", summary: "" }];
    expect(hasRecentActivity(activity, now, 3)).toBe(true);
  });

  it("is false outside the window", () => {
    const now = new Date("2026-01-10T00:00:00Z");
    const activity = [{ id: "1", type: "quiz" as const, createdAt: "2026-01-01T00:00:00Z", courseId: "c1", summary: "" }];
    expect(hasRecentActivity(activity, now, 3)).toBe(false);
  });

  it("is false with no activity at all", () => {
    expect(hasRecentActivity([], new Date())).toBe(false);
  });
});

describe("buildRecommendations", () => {
  it("recommends the weakest concept when mastery is low", () => {
    const recs = buildRecommendations({
      mastery: [{ course_id: "c1", concept_tag: "Vectors", dimension: "overall", mastery_score: 0.3 }],
      courses: [{ id: "c1", title: "Physics", mode: "general" }],
      dueCount: 0,
      recentActivity: true,
    });
    expect(recs.some((r) => r.id === "weak-concept" && r.title.includes("Vectors"))).toBe(true);
  });

  it("names the specific rubric dimension when the weak signal isn't 'overall'", () => {
    const recs = buildRecommendations({
      mastery: [
        { course_id: "c1", concept_tag: "WWI causes", dimension: "recall", mastery_score: 0.9 },
        { course_id: "c1", concept_tag: "WWI causes", dimension: "analysis", mastery_score: 0.35 },
      ],
      courses: [{ id: "c1", title: "History", mode: "general" }],
      dueCount: 0,
      recentActivity: true,
    });
    const rec = recs.find((r) => r.id === "weak-concept");
    expect(rec?.title).toContain("analysis");
    expect(rec?.reason).toContain("analysis");
  });

  it("does not recommend a concept that's already well mastered", () => {
    const recs = buildRecommendations({
      mastery: [{ course_id: "c1", concept_tag: "Vectors", dimension: "overall", mastery_score: 0.9 }],
      courses: [{ id: "c1", title: "Physics", mode: "general" }],
      dueCount: 0,
      recentActivity: true,
    });
    expect(recs.some((r) => r.id === "weak-concept")).toBe(false);
  });

  it("suggests starting a course when there are none", () => {
    const recs = buildRecommendations({ mastery: [], courses: [], dueCount: 0, recentActivity: false });
    expect(recs.some((r) => r.id === "start")).toBe(true);
  });

  it("caps at 3 recommendations", () => {
    const recs = buildRecommendations({
      mastery: [{ course_id: "c1", concept_tag: "Vectors", dimension: "overall", mastery_score: 0.1 }],
      courses: [{ id: "c1", title: "Physics", mode: "general" }],
      dueCount: 5,
      recentActivity: false,
    });
    expect(recs.length).toBeLessThanOrEqual(3);
  });
});

describe("quizAccuracy", () => {
  it("returns null with no attempts", () => {
    expect(quizAccuracy([])).toBeNull();
  });

  it("computes a rounded percentage", () => {
    expect(quizAccuracy([{ correct: true }, { correct: true }, { correct: false }])).toBe(67);
  });
});

describe("buildTodaysFocus", () => {
  it("prioritizes due cards over everything else", () => {
    const result = buildTodaysFocus({
      dueCount: 3,
      focusCourse: { id: "c1", title: "Physics", mode: "general" },
      focusCourseProgress: 0.5,
    });
    expect(result.href).toBe("/review");
    expect(result.title).toContain("3 due card");
  });

  it("falls back to continuing the focus course when nothing is due", () => {
    const result = buildTodaysFocus({
      dueCount: 0,
      focusCourse: { id: "c1", title: "Physics", mode: "general" },
      focusCourseProgress: 0.68,
    });
    expect(result.href).toBe("/courses/c1");
    expect(result.detail).toBe("68% mastery");
  });

  it("suggests starting a course with no courses and nothing due", () => {
    const result = buildTodaysFocus({ dueCount: 0, focusCourse: null, focusCourseProgress: null });
    expect(result.href).toBe("/courses/new");
  });
});

describe("buildContinueLearning", () => {
  it("returns null with no focus course", () => {
    expect(buildContinueLearning({ focusCourse: null, focusCourseProgress: null })).toBeNull();
  });

  it("shows real progress, not a fabricated percentage", () => {
    const result = buildContinueLearning({
      focusCourse: { id: "c1", title: "Physics", mode: "general" },
      focusCourseProgress: 0.42,
    });
    expect(result?.detail).toBe("42% mastery");
  });

  it("says 'just started' rather than 0% when nothing's been attempted", () => {
    const result = buildContinueLearning({
      focusCourse: { id: "c1", title: "Physics", mode: "general" },
      focusCourseProgress: null,
    });
    expect(result?.detail).toBe("Just started");
  });
});

describe("buildUpcomingDeadlines", () => {
  const now = new Date("2026-09-08T00:00:00Z");

  it("excludes courses with no exam date — nothing invented", () => {
    const courses = [{ id: "c1", title: "No deadline", exam_date: null }];
    expect(buildUpcomingDeadlines(courses, new Map(), now)).toHaveLength(0);
  });

  it("sorts soonest first regardless of input order", () => {
    const courses = [
      { id: "c1", title: "Later", exam_date: "2026-10-01" },
      { id: "c2", title: "Sooner", exam_date: "2026-09-10" },
    ];
    const result = buildUpcomingDeadlines(courses, new Map(), now);
    expect(result.map((d) => d.courseId)).toEqual(["c2", "c1"]);
  });

  it("does not clamp a past date to zero — callers need to distinguish overdue from today", () => {
    const courses = [{ id: "c1", title: "Overdue", exam_date: "2026-09-01" }];
    const result = buildUpcomingDeadlines(courses, new Map(), now);
    expect(result[0].daysRemaining).toBeLessThan(0);
  });

  it("carries real mastery percent when available, null otherwise", () => {
    const courses = [
      { id: "c1", title: "Attempted", exam_date: "2026-09-20" },
      { id: "c2", title: "Untouched", exam_date: "2026-09-25" },
    ];
    const progress = new Map([["c1", 0.73]]);
    const result = buildUpcomingDeadlines(courses, progress, now);
    expect(result.find((d) => d.courseId === "c1")?.masteryPercent).toBe(73);
    expect(result.find((d) => d.courseId === "c2")?.masteryPercent).toBeNull();
  });
});
