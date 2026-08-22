"use client";

import { useState } from "react";
import { FileTextIcon, TargetIcon, GraduationCapIcon } from "lucide-react";
import { ChatPanel, type QuickAction } from "@/components/ChatPanel";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import type { LearningMode } from "@/lib/prompts/tutorChat";

const LEARNING_MODES: { id: LearningMode; label: string }[] = [
  { id: "explain", label: "Explain" },
  { id: "practice", label: "Practice" },
  { id: "review", label: "Review" },
  { id: "examPrep", label: "Exam Prep" },
  { id: "homeworkHelp", label: "Homework Help" },
];

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Explain", prompt: "Can you explain the main idea of this course so far?" },
  { label: "Simplify", prompt: "Can you explain that more simply?" },
  { label: "Give an example", prompt: "Can you give a concrete example?" },
  { label: "Quiz me", prompt: "Can you quiz me on this with one question?" },
  { label: "Challenge me", prompt: "Give me a harder question to test my understanding." },
  { label: "Summarize", prompt: "Can you summarize what we've covered?" },
];

interface TutorWorkspaceProps {
  courseId: string;
  courseTitle: string;
  level: string;
  hasMaterial: boolean;
  sourceTitle: string | null;
}

export function TutorWorkspace({ courseId, courseTitle, level, hasMaterial, sourceTitle }: TutorWorkspaceProps) {
  const [mode, setMode] = useState<LearningMode>("explain");

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
      {/* Context panel — what Clarity currently understands */}
      <Reveal tier="content" className="lg:w-64 shrink-0">
        <GlassPanel className="p-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-subtle uppercase tracking-wide">Subject</p>
            <p className="text-sm font-medium mt-0.5">{courseTitle}</p>
          </div>
          <div className="flex items-start gap-2">
            <FileTextIcon className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-subtle uppercase tracking-wide">Material</p>
              <p className="text-sm mt-0.5 text-muted-foreground">
                {hasMaterial ? sourceTitle ?? "Uploaded source" : "No material uploaded"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <TargetIcon className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-subtle uppercase tracking-wide">Level</p>
              <p className="text-sm mt-0.5 text-muted-foreground capitalize">{level}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <GraduationCapIcon className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-xs font-medium text-subtle uppercase tracking-wide">Learning mode</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {LEARNING_MODES.map((m) => (
                  <Button
                    key={m.id}
                    type="button"
                    size="xs"
                    variant={mode === m.id ? "default" : "outline"}
                    onClick={() => setMode(m.id)}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>
      </Reveal>

      {/* Conversation */}
      <Reveal tier="content" delay={0.05} className="flex-1 min-h-0 min-w-0 flex flex-col">
        <GlassPanel className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <ChatPanel
            endpoint="/api/tutor/chat"
            body={{ courseId, mode }}
            placeholder="Ask about a concept from this course to start the conversation."
            quickActions={QUICK_ACTIONS}
            showMessageActions
          />
        </GlassPanel>
      </Reveal>
    </div>
  );
}
