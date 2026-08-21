import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamComplete, MODELS } from "@/lib/anthropic";
import { languageRoleplaySystemPrompt } from "@/lib/prompts/languageRoleplay";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Not authenticated", { status: 401 });
  }

  const body = await req.json();
  const courseId: string | undefined = body.courseId;
  const scenario: string = body.scenario ?? "casual small talk";
  const messages: { role: "user" | "assistant"; content: string }[] = body.messages ?? [];

  if (!courseId || messages.length === 0) {
    return new Response("courseId and messages are required", { status: 400 });
  }

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) {
    return new Response("Course not found", { status: 404 });
  }

  const system = languageRoleplaySystemPrompt({
    targetLanguage: course.target_language ?? "Spanish",
    scenario,
    proficiencyLevel: course.proficiency_level ?? "beginner",
  });

  void supabase.from("chat_messages").insert({
    user_id: user.id,
    course_id: courseId,
    role: "user",
    content: messages.at(-1)!.content,
  });

  const encoder = new TextEncoder();
  let fullReply = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const token of streamComplete({ model: MODELS.smart, system, messages })) {
          fullReply += token;
          controller.enqueue(encoder.encode(token));
        }
      } finally {
        controller.close();
        if (fullReply) {
          void supabase.from("chat_messages").insert({
            user_id: user.id,
            course_id: courseId,
            role: "assistant",
            content: fullReply,
          });
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
