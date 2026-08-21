"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadDropzone } from "@/components/UploadDropzone";
import type { Level, Mode } from "@/types/db";

function NewCourseForm() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = (params.get("mode") as Mode) ?? "general";
  const level = (params.get("level") as Level) ?? "beginner";

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!text.trim() && !file) {
      toast.error("Paste some text or upload a PDF first.");
      return;
    }

    setBusy(true);
    try {
      setStatus("Extracting and embedding content…");
      let ingestRes: Response;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        ingestRes = await fetch("/api/ingest", { method: "POST", body: form });
      } else {
        ingestRes = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      }

      if (!ingestRes.ok) throw new Error(await ingestRes.text());
      const { sourceId } = await ingestRes.json();

      setStatus("Generating your course outline…");
      const courseRes = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, mode, level }),
      });

      if (!courseRes.ok) throw new Error(await courseRes.text());
      const { course } = await courseRes.json();

      router.push(`/courses/${course.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      setStatus(null);
      setBusy(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Add your material</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Tabs defaultValue="text">
            <TabsList>
              <TabsTrigger value="text">Paste text</TabsTrigger>
              <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste a chapter, article, or notes…"
                className="min-h-40"
              />
            </TabsContent>
            <TabsContent value="pdf" className="mt-4">
              <UploadDropzone onFile={setFile} />
            </TabsContent>
          </Tabs>

          {status && <p className="text-sm text-muted-foreground">{status}</p>}

          <Button onClick={handleSubmit} disabled={busy} size="lg">
            {busy ? "Working…" : "Generate my course"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function NewCoursePage() {
  return (
    <Suspense>
      <NewCourseForm />
    </Suspense>
  );
}
