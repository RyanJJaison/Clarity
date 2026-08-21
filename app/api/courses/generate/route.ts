import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { complete, MODELS } from "@/lib/anthropic";
import { outlineSystemPrompt, outlineUserPrompt } from "@/lib/prompts/outline";
import type { CourseOutline, Level, Mode } from "@/types/db";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const sourceId: string | undefined = body.sourceId;
  const mode: Mode | undefined = body.mode;
  const level: Level = body.level ?? "beginner";
  const title: string | undefined = body.title;

  if (!sourceId || !mode) {
    return NextResponse.json({ error: "sourceId and mode are required" }, { status: 400 });
  }

  const { data: source, error: sourceError } = await supabase
    .from("content_sources")
    .select("*")
    .eq("id", sourceId)
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  const outline = await generateOutlineWithRetry(source.raw_text ?? "", level);

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({
      user_id: user.id,
      source_id: sourceId,
      mode,
      title: title ?? source.title,
      outline,
    })
    .select()
    .single();

  if (courseError || !course) {
    return NextResponse.json({ error: courseError?.message ?? "Failed to create course" }, { status: 500 });
  }

  return NextResponse.json({ course });
}

async function generateOutlineWithRetry(content: string, level: Level): Promise<CourseOutline> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await complete({
      model: MODELS.smart,
      system: outlineSystemPrompt(),
      prompt: outlineUserPrompt({ level, content }),
      maxTokens: 2048,
    });
    try {
      return withLessonIds(JSON.parse(extractJson(raw)));
    } catch {
      // retry once on malformed JSON
    }
  }
  // Fallback so the flow never dead-ends even if the model misbehaves twice.
  return { modules: [{ title: "Overview", lessons: [{ id: "1", title: "Getting started", conceptTags: [] }] }] };
}

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

function withLessonIds(raw: {
  modules: { title: string; lessons: { title: string; conceptTags: string[] }[] }[];
}): CourseOutline {
  let counter = 0;
  return {
    modules: raw.modules.map((m) => ({
      title: m.title,
      lessons: m.lessons.map((l) => ({ id: String(++counter), title: l.title, conceptTags: l.conceptTags })),
    })),
  };
}
