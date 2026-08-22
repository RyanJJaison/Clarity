import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/streak";
import {
  buildContinueLearning,
  buildRecentActivity,
  buildRecommendations,
  buildTodaysFocus,
  courseProgress,
  hasRecentActivity,
  mostActiveCourseId,
  quizAccuracy,
} from "@/lib/dashboard-data";
import { DashboardView } from "./DashboardView";

export default async function DashboardPage() {
  const now = new Date();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mastery } = await supabase
    .from("mastery")
    .select("course_id, concept_tag, mastery_score")
    .eq("user_id", user!.id);

  const { count: dueCount } = await supabase
    .from("srs_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .lte("due_date", now.toISOString().slice(0, 10));

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, mode")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: streakAttempts } = await supabase
    .from("attempts")
    .select("created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(365);

  const { data: recentAttemptsRaw } = await supabase
    .from("attempts")
    .select("id, created_at, correct, quiz_items(question, course_id)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: recentChatsRaw } = await supabase
    .from("chat_messages")
    .select("id, created_at, content, course_id")
    .eq("user_id", user!.id)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(10);

  const streak = computeStreak((streakAttempts ?? []).map((a) => a.created_at), now);

  const recentAttempts = (recentAttemptsRaw ?? [])
    .map((a) => {
      const item = a.quiz_items as unknown as { question: string; course_id: string } | null;
      return item ? { id: a.id, created_at: a.created_at, correct: a.correct, question: item.question, course_id: item.course_id } : null;
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const activity = buildRecentActivity(recentAttempts, recentChatsRaw ?? []);
  const recentActive = hasRecentActivity(activity, now);
  const progress = courseProgress(mastery ?? []);
  const focusCourseId = mostActiveCourseId(activity, courses?.[0]?.id ?? null);
  const focusCourse = courses?.find((c) => c.id === focusCourseId) ?? null;

  const recommendations = buildRecommendations({
    mastery: mastery ?? [],
    courses: courses ?? [],
    dueCount: dueCount ?? 0,
    recentActivity: recentActive,
  });

  const last30Attempts = recentAttempts.filter(
    (a) => now.getTime() - new Date(a.created_at).getTime() < 30 * 24 * 60 * 60 * 1000
  );

  const focusCourseProgress = focusCourse ? progress.get(focusCourse.id) ?? null : null;
  const todaysFocus = buildTodaysFocus({ dueCount: dueCount ?? 0, focusCourse, focusCourseProgress });
  const continueLearning = buildContinueLearning({ focusCourse, focusCourseProgress });

  return (
    <DashboardView
      email={user!.email ?? ""}
      mastery={mastery ?? []}
      dueCount={dueCount ?? 0}
      streak={streak}
      courses={courses ?? []}
      activity={activity}
      recommendations={recommendations}
      courseProgress={Object.fromEntries(progress)}
      focusCourse={focusCourse}
      quizAccuracy={quizAccuracy(last30Attempts)}
      todaysFocus={todaysFocus}
      continueLearning={continueLearning}
    />
  );
}
