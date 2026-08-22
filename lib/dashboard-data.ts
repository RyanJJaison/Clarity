/**
 * Pure functions that derive dashboard content (recent activity, per-course
 * progress, recommendations) from real rows already in the database. Every
 * output here traces back to an actual attempts/chat_messages/mastery row —
 * nothing is fabricated. Where a field the design asks for isn't tracked
 * anywhere (per-lesson completion %, time-remaining, assignment deadlines),
 * it's simply not produced — the UI shows an honest empty state instead.
 */

export interface MasteryRow {
  course_id: string;
  concept_tag: string;
  mastery_score: number;
}

export interface CourseRow {
  id: string;
  title: string;
  mode: string;
}

export interface AttemptActivityRow {
  id: string;
  created_at: string;
  correct: boolean;
  question: string;
  course_id: string;
}

export interface ChatActivityRow {
  id: string;
  created_at: string;
  content: string;
  course_id: string;
}

export interface ActivityItem {
  id: string;
  type: "quiz" | "chat";
  createdAt: string;
  courseId: string;
  summary: string;
}

/** Merges quiz attempts and chat messages into one recency-sorted feed. */
export function buildRecentActivity(
  attempts: AttemptActivityRow[],
  chats: ChatActivityRow[],
  limit = 6
): ActivityItem[] {
  const quizItems: ActivityItem[] = attempts.map((a) => ({
    id: `attempt-${a.id}`,
    type: "quiz",
    createdAt: a.created_at,
    courseId: a.course_id,
    summary: a.correct ? `Answered correctly: ${truncate(a.question, 72)}` : `Practiced: ${truncate(a.question, 72)}`,
  }));
  const chatItems: ActivityItem[] = chats.map((c) => ({
    id: `chat-${c.id}`,
    type: "chat",
    createdAt: c.created_at,
    courseId: c.course_id,
    summary: `Asked: ${truncate(c.content, 72)}`,
  }));

  return [...quizItems, ...chatItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** Average mastery score per course, from whatever concepts have been attempted. */
export function courseProgress(mastery: MasteryRow[]): Map<string, number> {
  const byCourse = new Map<string, number[]>();
  for (const m of mastery) {
    const list = byCourse.get(m.course_id) ?? [];
    list.push(m.mastery_score);
    byCourse.set(m.course_id, list);
  }
  const result = new Map<string, number>();
  for (const [courseId, scores] of byCourse) {
    result.set(courseId, scores.reduce((s, v) => s + v, 0) / scores.length);
  }
  return result;
}

/** The course the student was last active in, or the newest course if there's no activity yet. */
export function mostActiveCourseId(activity: ActivityItem[], fallbackCourseId: string | null): string | null {
  return activity[0]?.courseId ?? fallbackCourseId;
}

/** Whether the most recent activity happened within the last `withinDays` days. */
export function hasRecentActivity(activity: ActivityItem[], now: Date, withinDays = 3): boolean {
  const latest = activity[0];
  if (!latest) return false;
  const ageMs = now.getTime() - new Date(latest.createdAt).getTime();
  return ageMs <= withinDays * 24 * 60 * 60 * 1000;
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  href: string;
}

/** Up to 3 recommendations, each traceable to a real signal — never invented. */
export function buildRecommendations(params: {
  mastery: MasteryRow[];
  courses: CourseRow[];
  dueCount: number;
  recentActivity: boolean;
}): Recommendation[] {
  const { mastery, courses, dueCount, recentActivity } = params;
  const recs: Recommendation[] = [];

  const weakest = [...mastery].sort((a, b) => a.mastery_score - b.mastery_score)[0];
  if (weakest && weakest.mastery_score < 0.6) {
    const course = courses.find((c) => c.id === weakest.course_id);
    recs.push({
      id: "weak-concept",
      title: `Review ${weakest.concept_tag}`,
      reason: `Your recent quiz results suggest this topic needs more practice — ${Math.round(weakest.mastery_score * 100)}% mastery so far.`,
      href: course ? `/tutor/${course.id}` : "/dashboard",
    });
  }

  if (dueCount > 0) {
    recs.push({
      id: "due-cards",
      title: `Review ${dueCount} due card${dueCount === 1 ? "" : "s"}`,
      reason: "Scheduled for today by the spaced-repetition system.",
      href: "/review",
    });
  }

  if (!recentActivity && courses.length > 0) {
    recs.push({
      id: "resume",
      title: `Continue ${courses[0].title}`,
      reason: "It's been a few days — pick up where you left off.",
      href: `/courses/${courses[0].id}`,
    });
  }

  if (courses.length === 0) {
    recs.push({
      id: "start",
      title: "Start your first course",
      reason: "Paste some text or upload a PDF to get a personalized course.",
      href: "/courses/new",
    });
  }

  return recs.slice(0, 3);
}

/** Quiz accuracy over the given attempts, as a 0-100 whole percentage, or null with no attempts. */
export function quizAccuracy(attempts: { correct: boolean }[]): number | null {
  if (attempts.length === 0) return null;
  const correct = attempts.filter((a) => a.correct).length;
  return Math.round((correct / attempts.length) * 100);
}
