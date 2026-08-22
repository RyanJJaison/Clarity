import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/streak";
import { DashboardView } from "./DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mastery } = await supabase.from("mastery").select("concept_tag, mastery_score").eq("user_id", user!.id);

  const { count: dueCount } = await supabase
    .from("srs_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .lte("due_date", new Date().toISOString().slice(0, 10));

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, mode")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: attempts } = await supabase
    .from("attempts")
    .select("created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(365);

  const streak = computeStreak((attempts ?? []).map((a) => a.created_at));

  return (
    <DashboardView
      mastery={mastery ?? []}
      dueCount={dueCount ?? 0}
      streak={streak}
      courses={courses ?? []}
    />
  );
}
