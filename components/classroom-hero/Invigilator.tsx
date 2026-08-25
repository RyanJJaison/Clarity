"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { XIcon } from "lucide-react";
import { AIInvigilator } from "@/components/ai-invigilator/AIInvigilator";
import { ChatPanel } from "@/components/ChatPanel";
import { spring } from "@/lib/motion";
import { rectToPositionPercent, type PixelRect } from "./backgroundCrop";

interface InvigilatorProps {
  position: PixelRect;
  focusCourse: { id: string; title: string } | null;
}

/**
 * Interactive invigilator character in the classroom scene.
 * Idle motion is a very small breathing pulse (no bouncing).
 */
export function Invigilator({ position, focusCourse }: InvigilatorProps) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [breathIn, setBreathIn] = useState(false);
  const pos = rectToPositionPercent(position);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setBreathIn((v) => !v), 2400);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="absolute" style={pos}>
      <motion.button
        type="button"
        aria-label={chatOpen ? "Close Clarity AI assistant panel" : "Open Clarity AI assistant panel"}
        aria-expanded={chatOpen}
        onClick={() => setChatOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="relative block w-full rounded-2xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        whileHover={
          reduceMotion
            ? undefined
            : {
                scale: 1.02,
                boxShadow: "0 0 18px 2px rgb(99 102 241 / 0.22)",
              }
        }
        transition={spring.snappy}
      >
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: breathIn ? 1.008 : 1,
                }
          }
          transition={spring.gentle}
        >
          <AIInvigilator state={chatOpen ? "listening" : "idle"} fluid animateIdle={false} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={spring.smooth}
            className="absolute left-full top-0 ml-3 z-20 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-surface-glass shadow-glass backdrop-blur-[var(--glass-blur)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-3 py-2">
              <span className="text-sm font-medium">Clarity AI Assistant</span>
              <button
                type="button"
                aria-label="Close Clarity AI assistant panel"
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
                  placeholder="Ask Clarity anything about your current course."
                />
              ) : (
                <p className="p-4 text-sm text-muted-foreground">Start a course first, then Clarity can assist from here.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hovered && <span className="sr-only">Clarity assistant available</span>}
    </div>
  );
}
