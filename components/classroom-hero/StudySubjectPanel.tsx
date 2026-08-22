"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileTextIcon } from "lucide-react";
import { GlassModal, GlassModalContent, GlassModalTitle } from "@/components/ui/glass-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useCourseIntake } from "@/lib/useCourseIntake";
import type { Level, Mode } from "@/types/db";

interface StudySubjectPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: Mode;
  level?: Level;
}

type Step = "choose" | "upload" | "manual";

/**
 * The whiteboard's zoom-in "what are you studying?" entry point — the same
 * ingest -> generate flow as /courses/new (useCourseIntake), presented as an
 * in-context overlay instead of a full navigation. Subject-agnostic by
 * construction: it just asks what you're studying and takes any material,
 * the same way for a history syllabus as for a chemistry one.
 */
export function StudySubjectPanel({ open, onOpenChange, mode = "general", level = "beginner" }: StudySubjectPanelProps) {
  const [step, setStep] = useState<Step>("choose");
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { submit, status, busy } = useCourseIntake();

  function reset() {
    setStep("choose");
    setSubject("");
    setExamDate("");
    setText("");
    setFile(null);
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
  }

  async function handleSubmit() {
    const result = await submit({ mode, level, title: subject || undefined, examDate: examDate || undefined, text, file });
    if (!result.ok) toast.error(result.error);
  }

  return (
    <GlassModal open={open} onOpenChange={handleOpenChange}>
      <GlassModalContent className="sm:max-w-md" showCloseButton>
        <GlassModalTitle className="sr-only">What are you studying?</GlassModalTitle>

        {step === "choose" ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <h2 className="font-heading text-xl font-semibold">What are you studying?</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Upload your syllabus, notes, or course material — any subject.
            </p>
            <Button size="lg" className="gap-2" onClick={() => setStep("upload")}>
              <FileTextIcon className="size-4" aria-hidden="true" />
              Upload material
            </Button>
            <p className="text-xs text-muted-foreground">or</p>
            <Button variant="ghost" onClick={() => setStep("manual")}>
              Enter it manually
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            <h2 className="font-heading text-lg font-semibold">What are you studying?</h2>

            <div className="flex flex-col gap-2">
              <Label htmlFor="panel-subject">Subject or course name (optional)</Label>
              <Input
                id="panel-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. World History, Contract Law, Spanish B2…"
              />
            </div>

            {step === "upload" ? (
              <UploadDropzone onFile={setFile} />
            ) : (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your syllabus, notes, or course material…"
                className="min-h-32"
              />
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="panel-exam-date">Exam or deadline date (optional)</Label>
              <Input
                id="panel-exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-fit"
              />
              <p className="text-xs text-muted-foreground">Helps prioritize your study plan around how much time is left.</p>
            </div>

            {status && <p className="text-sm text-muted-foreground">{status}</p>}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("choose")} disabled={busy}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={busy} className="flex-1">
                {busy ? "Working…" : "Generate my course"}
              </Button>
            </div>
          </div>
        )}
      </GlassModalContent>
    </GlassModal>
  );
}
