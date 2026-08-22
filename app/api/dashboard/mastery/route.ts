import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/streak";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get("courseId");

  let query = supabase.from("mastery").select("*").eq("user_id", user.id);
  if (courseId) query = query.eq("course_id", courseId);

  const { data: mastery, error } = await query.order("concept_tag");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count: dueCount } = await supabase
    .from("srs_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("due_date", new Date().toISOString().slice(0, 10));

  const { data: attempts } = await supabase
    .from("attempts")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(365);

  const streak = computeStreak((attempts ?? []).map((a) => a.created_at));

  return NextResponse.json({ mastery, dueCount: dueCount ?? 0, streak });
}
