import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get("courseId");

  const { data, error } = await supabase
    .from("srs_cards")
    .select("*, quiz_items(question, item_type, options, answer, explanation, concept_tag, course_id)")
    .eq("user_id", user.id)
    .lte("due_date", new Date().toISOString().slice(0, 10))
    .order("due_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cards = courseId
    ? data.filter((c) => (c.quiz_items as unknown as { course_id: string })?.course_id === courseId)
    : data;

  return NextResponse.json({ cards, count: cards.length });
}
