import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embed } from "@/lib/embeddings";
import { chunkText } from "@/lib/rag";
import type { SourceType } from "@/types/db";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let type: SourceType;
  let title: string;
  let rawText: string;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF uploads are supported" }, { status: 400 });
    }
    const MAX_BYTES = 20 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (20MB max)" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    rawText = parsed.text;
    title = file.name;
    type = "pdf";
  } else {
    const body = await req.json();
    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    rawText = body.text;
    title = body.title || "Pasted text";
    type = "text";
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: "No text could be extracted" }, { status: 400 });
  }

  const { data: source, error: sourceError } = await supabase
    .from("content_sources")
    .insert({ user_id: user.id, type, title, raw_text: rawText })
    .select()
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: sourceError?.message ?? "Failed to store source" }, { status: 500 });
  }

  const chunks = chunkText(rawText);
  const embeddings = await embed(chunks.map((c) => c.text));

  const { error: chunksError } = await supabase.from("content_chunks").insert(
    chunks.map((c, i) => ({
      source_id: source.id,
      chunk_text: c.text,
      position: c.position,
      embedding: embeddings[i],
    }))
  );

  if (chunksError) {
    return NextResponse.json({ error: chunksError.message }, { status: 500 });
  }

  return NextResponse.json({ sourceId: source.id, chunkCount: chunks.length });
}
