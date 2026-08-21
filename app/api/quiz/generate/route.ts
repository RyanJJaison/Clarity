import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { complete, MODELS } from "@/lib/anthropic";
import { quizGenSystemPrompt, quizGenUserPrompt } from "@/lib/prompts/quizGen";
import type { ItemType } from "@/types/db";

interface GeneratedItem {
  question: string;
  itemType: ItemType;
  options: string[] | null;
  answer: string;
  explanation: string;
  conceptTag: string;
  difficulty: number;
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
  const lessonId: string | undefined = body.lessonId;
  const conceptTag: string | undefined = body.conceptTag;
  const difficulty: number = body.difficulty ?? 3;
  const count: number = Math.min(body.count ?? 5, 10);

  if (!courseId || !conceptTag) {
    return NextResponse.json({ error: "courseId and conceptTag are required" }, { status: 400 });
  }

  const { data: source } = await supabase
    .from("courses")
    .select("source_id, content_sources(raw_text)")
    .eq("id", courseId)
    .single();

  const content = (source?.content_sources as unknown as { raw_text: string } | null)?.raw_text ?? "";

  const items = await generateItemsWithRetry({ count, conceptTag, difficulty, content });

  const { data: inserted, error } = await supabase
    .from("quiz_items")
    .insert(
      items.map((item) => ({
        course_id: courseId,
        lesson_id: lessonId ?? null,
        question: item.question,
        item_type: item.itemType,
        options: item.options,
        answer: item.answer,
        explanation: item.explanation,
        concept_tag: item.conceptTag,
        difficulty: item.difficulty,
      }))
    )
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: inserted });
}

async function generateItemsWithRetry(params: {
  count: number;
  conceptTag: string;
  difficulty: number;
  content: string;
}): Promise<GeneratedItem[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await complete({
      model: MODELS.fast,
      system: quizGenSystemPrompt(),
      prompt: quizGenUserPrompt(params),
      maxTokens: 2048,
    });
    try {
      const parsed = JSON.parse(extractJson(raw));
      if (Array.isArray(parsed)) return parsed as GeneratedItem[];
    } catch {
      // retry once on malformed JSON
    }
  }
  return [];
}

function extractJson(text: string): string {
  const match = text.match(/\[[\s\S]*\]/);
  return match ? match[0] : text;
}
