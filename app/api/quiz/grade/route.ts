import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { complete, MODELS } from "@/lib/anthropic";
import { quizGradeSystemPrompt, quizGradeUserPrompt } from "@/lib/prompts/quizGrade";
import { recordAttempt, newDifficultyState } from "@/lib/difficulty";

interface GradeResult {
  correct: boolean;
  feedback: string;
}

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
  const response: string = body.response ?? "";

  if (!quizItemId) {
    return NextResponse.json({ error: "quizItemId is required" }, { status: 400 });
  }

  const { data: item, error: itemError } = await supabase
    .from("quiz_items")
    .select("*")
    .eq("id", quizItemId)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: "Quiz item not found" }, { status: 404 });
  }

  let result: GradeResult;
  if (item.item_type === "mcq") {
    // Exact-match grading for MCQ; no need to spend a model call.
    result = {
      correct: response.trim().toLowerCase() === item.answer.trim().toLowerCase(),
      feedback: item.explanation ?? "",
    };
  } else {
    result = await gradeWithRetry({ question: item.question, answer: item.answer, response });
  }

  await supabase.from("attempts").insert({
    user_id: user.id,
    quiz_item_id: quizItemId,
    correct: result.correct,
    response_text: response,
    difficulty_at_attempt: item.difficulty,
  });

  if (item.concept_tag) {
    await updateMastery(supabase, user.id, item.course_id, item.concept_tag, result.correct);
  }

  return NextResponse.json(result);
}

async function gradeWithRetry(params: {
  question: string;
  answer: string;
  response: string;
}): Promise<GradeResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await complete({
      model: MODELS.fast,
      system: quizGradeSystemPrompt(),
      prompt: quizGradeUserPrompt(params),
      maxTokens: 256,
    });
    try {
      return JSON.parse(extractJson(raw)) as GradeResult;
    } catch {
      // retry once on malformed JSON
    }
  }
  return { correct: false, feedback: "Couldn't grade this automatically — please review manually." };
}

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

async function updateMastery(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  courseId: string,
  conceptTag: string,
  correct: boolean
) {
  const { data: existing } = await supabase
    .from("mastery")
    .select("mastery_score")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("concept_tag", conceptTag)
    .maybeSingle();

  const state = newDifficultyState();
  state.masteryScore = existing?.mastery_score ?? 0;
  const updated = recordAttempt(state, correct);

  await supabase.from("mastery").upsert({
    user_id: userId,
    course_id: courseId,
    concept_tag: conceptTag,
    mastery_score: updated.masteryScore,
    updated_at: new Date().toISOString(),
  });
}
