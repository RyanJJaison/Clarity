import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamComplete, MODELS } from "@/lib/anthropic";
import { embed } from "@/lib/embeddings";
import { formatContext, type RetrievedChunk } from "@/lib/rag";
import { tutorChatSystemPrompt, type LearningMode } from "@/lib/prompts/tutorChat";

const TOP_K = 5;
// How many results each retrieval arm contributes to the fusion before the top
// TOP_K are taken. Wider than TOP_K so a chunk ranked poorly by one arm can
// still be rescued by the other.
const CANDIDATE_COUNT = 20;

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
  const messages: { role: "user" | "assistant"; content: string }[] = body.messages ?? [];
  const mode: LearningMode | undefined = body.mode;

  if (!courseId || messages.length === 0) {
    return new Response("courseId and messages are required", { status: 400 });
  }

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) {
    return new Response("Course not found", { status: 404 });
  }

  const lastUserMessage = messages.at(-1)!.content;
  const retrievedContext = await retrieveContext(supabase, course.source_id, lastUserMessage);

  const system = tutorChatSystemPrompt({
    courseTitle: course.title,
    level: course.proficiency_level ?? "intermediate",
    retrievedContext,
    mode,
  });

  // Fire-and-forget persistence of the user's turn; doesn't block the stream.
  void supabase.from("chat_messages").insert({
    user_id: user.id,
    course_id: courseId,
    role: "user",
    content: lastUserMessage,
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

async function retrieveContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceId: string | null,
  query: string
): Promise<string> {
  if (!sourceId) return "(no source material attached to this course)";

  const [queryEmbedding] = await embed([query]);
  // Hybrid (vector + full-text, RRF-fused) retrieval. The raw query text is
  // passed alongside the embedding so the keyword arm can match exact terms the
  // embedding alone tends to blur.
  const { data, error } = await supabase.rpc("match_content_chunks_hybrid", {
    query_embedding: queryEmbedding,
    query_text: query,
    match_source_id: sourceId,
    match_count: TOP_K,
    candidate_count: CANDIDATE_COUNT,
  });

  if (error || !data) return "(context retrieval unavailable)";

  const chunks: RetrievedChunk[] = data.map((row: { chunk_text: string; similarity: number }) => ({
    chunkText: row.chunk_text,
    similarity: row.similarity,
  }));

  return formatContext(chunks);
}
