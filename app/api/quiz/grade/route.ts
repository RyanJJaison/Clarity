import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { complete, MODELS } from "@/lib/anthropic";
import {
  quizGradeSystemPrompt,
  quizGradeUserPrompt,
  quizGradeRubricSystemPrompt,
  quizGradeRubricUserPrompt,
  quizGradeReflectionSystemPrompt,
  quizGradeReflectionUserPrompt,
} from "@/lib/prompts/quizGrade";
import { recordAttempt, newDifficultyState, type AttemptOutcome } from "@/lib/difficulty";
import type { DimensionScore, GradingMode } from "@/types/db";

interface GradeResult {
  correct: boolean | null; // null only for reflection mode — there's no "correct" for a discussion prompt
  feedback: string;
  dimensionScores?: DimensionScore[];
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

  const gradingMode: GradingMode = item.grading_mode ?? "ai_boolean";
  const result = await grade(gradingMode, item, response);

  // Reflection activities (teach-back, discussion) are never scored: no
  // attempts row, no mastery impact — by design, per the activity type.
  if (gradingMode === "reflection") {
    return NextResponse.json(result);
  }

  await supabase.from("attempts").insert({
    user_id: user.id,
    quiz_item_id: quizItemId,
    correct: result.correct ?? false,
    response_text: response,
    difficulty_at_attempt: item.difficulty,
    dimension_scores: result.dimensionScores ?? null,
    feedback: result.feedback,
  });

  if (item.concept_tag) {
    await updateMastery(supabase, user.id, item.course_id, item.concept_tag, result);
  }

  return NextResponse.json(result);
}

async function grade(mode: GradingMode, item: { question: string; answer: string; rubric_dimensions: string[] | null }, response: string): Promise<GradeResult> {
  switch (mode) {
    case "exact":
      return {
        correct: response.trim().toLowerCase() === item.answer.trim().toLowerCase(),
        feedback: "",
      };
    case "ai_rubric":
      return gradeRubricWithRetry({
        question: item.question,
        modelAnswer: item.answer,
        rubricDimensions: item.rubric_dimensions?.length ? item.rubric_dimensions : ["overall"],
        response,
      });
    case "reflection":
      return gradeReflectionWithRetry({ question: item.question, response });
    case "ai_boolean":
    default:
      return gradeWithRetry({ question: item.question, answer: item.answer, response });
  }
}

async function gradeWithRetry(params: { question: string; answer: string; response: string }): Promise<GradeResult> {
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

async function gradeRubricWithRetry(params: {
  question: string;
  modelAnswer: string;
  rubricDimensions: string[];
  response: string;
}): Promise<GradeResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await complete({
      model: MODELS.smart, // rubric grading needs more judgment than a fast factual check
      system: quizGradeRubricSystemPrompt(),
      prompt: quizGradeRubricUserPrompt(params),
      maxTokens: 512,
    });
    try {
      const parsed = JSON.parse(extractJson(raw)) as {
        dimensionScores: DimensionScore[];
        correct: boolean;
        feedback: string;
      };
      return { correct: parsed.correct, feedback: parsed.feedback, dimensionScores: parsed.dimensionScores };
    } catch {
      // retry once on malformed JSON
    }
  }
  return { correct: false, feedback: "Couldn't grade this automatically — please review manually." };
}

async function gradeReflectionWithRetry(params: { question: string; response: string }): Promise<GradeResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await complete({
      model: MODELS.fast,
      system: quizGradeReflectionSystemPrompt(),
      prompt: quizGradeReflectionUserPrompt(params),
      maxTokens: 256,
    });
    try {
      const parsed = JSON.parse(extractJson(raw)) as { feedback: string };
      return { correct: null, feedback: parsed.feedback };
    } catch {
      // retry once on malformed JSON
    }
  }
  return { correct: null, feedback: "Thanks for sharing your thinking." };
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
  result: GradeResult
) {
  const dimensions: { dimension: string; outcome: AttemptOutcome }[] = result.dimensionScores?.length
    ? result.dimensionScores.map((d) => ({ dimension: d.dimension, outcome: d.score }))
    : [{ dimension: "overall", outcome: result.correct ?? false }];

  for (const { dimension, outcome } of dimensions) {
    const { data: existing } = await supabase
      .from("mastery")
      .select("mastery_score")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("concept_tag", conceptTag)
      .eq("dimension", dimension)
      .maybeSingle();

    const state = newDifficultyState();
    state.masteryScore = existing?.mastery_score ?? 0;
    const updated = recordAttempt(state, outcome);

    await supabase.from("mastery").upsert(
      {
        user_id: userId,
        course_id: courseId,
        concept_tag: conceptTag,
        dimension,
        mastery_score: updated.masteryScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id,concept_tag,dimension" }
    );
  }
}
