import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { complete, MODELS } from "@/lib/anthropic";
import { examReadinessSystemPrompt, examReadinessUserPrompt } from "@/lib/prompts/examReadiness";

interface ReadinessResult {
  readinessScore: number;
  weakConcepts: string[];
  rationale: string;
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
  const courseId: string | undefined = body.courseId;
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  const { data: course } = await supabase.from("courses").select("exam_date").eq("id", courseId).single();
  const daysRemaining = course?.exam_date
    ? Math.max(0, Math.ceil((new Date(course.exam_date).getTime() - Date.now()) / 86_400_000))
    : 14;

  const { data: mastery } = await supabase
    .from("mastery")
    .select("concept_tag, mastery_score")
    .eq("user_id", user.id)
    .eq("course_id", courseId);

  const accuracyByConceptJson = JSON.stringify(mastery ?? []);

  const result = await predictWithRetry({ daysRemaining, accuracyByConceptJson });

  return NextResponse.json(result);
}

async function predictWithRetry(params: {
  daysRemaining: number;
  accuracyByConceptJson: string;
}): Promise<ReadinessResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await complete({
      model: MODELS.fast,
      system: examReadinessSystemPrompt(),
      prompt: examReadinessUserPrompt(params),
      maxTokens: 512,
    });
    try {
      return JSON.parse(extractJson(raw)) as ReadinessResult;
    } catch {
      // retry once on malformed JSON
    }
  }
  return { readinessScore: 0, weakConcepts: [], rationale: "Not enough data yet to estimate readiness." };
}

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}
