import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { complete, MODELS } from "@/lib/anthropic";
import { invigilatorSystemPrompt, invigilatorUserPrompt } from "@/lib/prompts/invigilator";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const phase: "start" | "end" = body.phase === "end" ? "end" : "start";
  const subject: string | undefined = body.subject;
  const elapsedMinutes: number = body.elapsedMinutes ?? 0;

  let dueCount: number | undefined;
  if (phase === "start") {
    const { count } = await supabase
      .from("srs_cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("due_date", new Date().toISOString().slice(0, 10));
    dueCount = count ?? 0;
  }

  const message = await complete({
    model: MODELS.fast,
    system: invigilatorSystemPrompt(),
    prompt: invigilatorUserPrompt({ phase, subject, elapsedMinutes, dueCount }),
    maxTokens: 120,
  });

  return NextResponse.json({ message });
}
