"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { XIcon } from "lucide-react";
import { AIInvigilator } from "@/components/ai-invigilator/AIInvigilator";
import { InvigilatorBubble, InvigilatorAction } from "@/components/ai-invigilator/InvigilatorBubble";
import { useInvigilatorGreeting } from "@/components/ai-invigilator/useInvigilatorGreeting";
import { ChatPanel } from "@/components/ChatPanel";
import { spring, transition } from "@/lib/motion";
import { rectToPositionPercent, type PixelRect } from "./backgroundCrop";

interface InvigilatorHotspotProps {
  position: PixelRect;
  focusCourse: { id: string; title: string } | null;
  todaysFocusHref: string;
}

/**
 * The most important interactive element in the scene. Idle motion is the
 * existing CSS-keyframe breathing/blink (no React state involved). Hover
 * adds a subtle attention response (tilt + lift, spring-snappy — not a
 * "move toward the cursor" pixel-tracking effect, which would mean
 * per-frame React state; a fixed small lean reads the same way for far
 * less cost). Click opens a real chat scoped to the student's focus
 * course, reusing the existing tutor-chat backend — not a new AI surface.
 */
export function InvigilatorHotspot({ position, focusCourse, todaysFocusHref }: InvigilatorHotspotProps) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { message, loading } = useInvigilatorGreeting(focusCourse?.title);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const pos = rectToPositionPercent(position);

  return (
    <div className="absolute" style={pos}>
      <motion.button
        type="button"
        aria-label={chatOpen ? "Close chat with Clarity" : "Ask Clarity — talk to your AI companion"}
        aria-expanded={chatOpen}
        onClick={() => setChatOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="relative block w-full rounded-2xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        animate={reduceMotion ? undefined : { rotate: hovered ? -2 : 0, y: hovered ? -3 : 0 }}
        transition={spring.snappy}
      >
        <AIInvigilator state={loading ? "thinking" : chatOpen ? "listening" : "idle"} fluid />
      </motion.button>

      {!bubbleDismissed && !chatOpen && (
        <div className="absolute left-full top-0 ml-3 w-56 sm:w-64 z-10">
          <InvigilatorBubble message={message ?? ""} loading={loading}>
            {focusCourse && (
              <InvigilatorAction asChild>
                <Link href={todaysFocusHref}>Continue</Link>
              </InvigilatorAction>
            )}
            <InvigilatorAction onClick={() => setBubbleDismissed(true)}>Dismiss</InvigilatorAction>
          </InvigilatorBubble>
        </div>
      )}

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={transition.enter}
            className="absolute left-full top-0 ml-3 z-20 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-surface-glass shadow-glass backdrop-blur-[var(--glass-blur)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-3 py-2">
              <span className="text-sm font-medium">Ask Clarity</span>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setChatOpen(false)}
                className="rounded-md p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {focusCourse ? (
                <ChatPanel
                  endpoint="/api/tutor/chat"
                  body={{ courseId: focusCourse.id }}
                  placeholder="Ask about anything from your course."
                />
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  Start a course first, then I can help with it right here.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
