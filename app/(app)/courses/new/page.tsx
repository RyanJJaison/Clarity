"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useCourseIntake } from "@/lib/useCourseIntake";
import type { Level, Mode } from "@/types/db";

function NewCourseForm() {
  const params = useSearchParams();
  const mode = (params.get("mode") as Mode) ?? "general";
  const level = (params.get("level") as Level) ?? "beginner";
  const { submit, status, busy } = useCourseIntake();

  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit() {
    const result = await submit({ mode, level, title: subject || undefined, examDate: examDate || undefined, text, file });
    if (!result.ok) toast.error(result.error);
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>What are you studying?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject">Subject or course name (optional)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Modern European History, Organic Chemistry, Spanish B2…"
            />
          </div>

          <Tabs defaultValue="text">
            <TabsList>
              <TabsTrigger value="text">Paste text</TabsTrigger>
              <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste a syllabus, chapter, article, or notes…"
                className="min-h-40"
              />
            </TabsContent>
            <TabsContent value="pdf" className="mt-4">
              <UploadDropzone onFile={setFile} />
            </TabsContent>
          </Tabs>

          <div className="flex flex-col gap-2">
            <Label htmlFor="examDate">Exam or deadline date (optional)</Label>
            <Input id="examDate" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-fit" />
            <p className="text-xs text-muted-foreground">Helps prioritize your study plan around how much time is left.</p>
          </div>

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
