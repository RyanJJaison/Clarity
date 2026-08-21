import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gradeFromOutcome, newCardState, reviewCard } from "@/lib/srs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const quizItemId: string | undefined = body.quizItemId;
  const correct: boolean | undefined = body.correct;
  const confident: boolean = body.confident ?? true;

  if (!quizItemId || typeof correct !== "boolean") {
    return NextResponse.json({ error: "quizItemId and correct are required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("srs_cards")
    .select("*")
    .eq("user_id", user.id)
    .eq("quiz_item_id", quizItemId)
    .maybeSingle();

  const currentState = existing
    ? { easeFactor: existing.ease_factor, intervalDays: existing.interval_days, repetitions: existing.repetitions }
    : newCardState();

  const grade = gradeFromOutcome(correct, confident);
  const result = reviewCard(currentState, grade);

  const { data: card, error } = await supabase
    .from("srs_cards")
    .upsert(
      {
        id: existing?.id,
        user_id: user.id,
        quiz_item_id: quizItemId,
        ease_factor: result.easeFactor,
        interval_days: result.intervalDays,
        repetitions: result.repetitions,
        due_date: result.dueDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,quiz_item_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ card });
}
