"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Level, Mode } from "@/types/db";

export interface CourseIntakeParams {
  mode: Mode;
  level: Level;
  /** "What are you studying?" — becomes the course title regardless of upload method. */
  title?: string;
  /** "YYYY-MM-DD", optional — feeds deadline-aware outline prioritization and exam readiness. */
  examDate?: string;
  text?: string;
  file?: File | null;
}

/**
 * The ingest -> generate submission flow, shared by /courses/new and the
 * classroom whiteboard's zoom-in panel so there's exactly one implementation
 * of "turn material into a course" rather than two copies drifting apart.
 */
export function useCourseIntake() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(params: CourseIntakeParams): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!params.text?.trim() && !params.file) {
      return { ok: false, error: "Paste some text or upload a PDF first." };
    }

    setBusy(true);
    try {
      setStatus("Extracting and embedding content…");
      let ingestRes: Response;
      if (params.file) {
        const form = new FormData();
        form.append("file", params.file);
        ingestRes = await fetch("/api/ingest", { method: "POST", body: form });
      } else {
        ingestRes = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: params.text, title: params.title }),
        });
      }

      if (!ingestRes.ok) throw new Error(await ingestRes.text());
      const { sourceId } = await ingestRes.json();

      setStatus("Generating your course outline…");
      const courseRes = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          mode: params.mode,
          level: params.level,
          title: params.title,
          examDate: params.examDate || undefined,
        }),
      });

      if (!courseRes.ok) throw new Error(await courseRes.text());
      const { course } = await courseRes.json();

      router.push(`/courses/${course.id}`);
      return { ok: true };
    } catch (err) {
      setStatus(null);
      return { ok: false, error: err instanceof Error ? err.message : "Something went wrong." };
    } finally {
      setBusy(false);
    }
  }

  return { submit, status, busy };
}
