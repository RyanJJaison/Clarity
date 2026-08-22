"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { PauseIcon, PlayIcon, SquareIcon, MessageSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadialProgress } from "@/components/motion/RadialProgress";
import { Reveal } from "@/components/motion/Reveal";
import { AIInvigilator, type InvigilatorState } from "@/components/ai-invigilator/AIInvigilator";
import { InvigilatorBubble } from "@/components/ai-invigilator/InvigilatorBubble";
import type { CourseSummary } from "@/components/navigation/nav-config";

const PRESETS = [25, 45, 60];

type Phase = "setup" | "running" | "paused" | "complete";

async function fetchInvigilatorMessage(phase: "start" | "end", subject: string | undefined, elapsedMinutes: number) {
  const res = await fetch("/api/focus/encourage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phase, subject, elapsedMinutes }),
  });
  const data = await res.json();
  return data.message as string;
}

export function FocusSession({ courses }: { courses: CourseSummary[] }) {
  const [courseId, setCourseId] = useState<string | undefined>(courses[0]?.id);
  const [presetMinutes, setPresetMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState("");
  const [phase, setPhase] = useState<Phase>("setup");
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);

  const secondsRef = useRef(25 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const course = courses.find((c) => c.id === courseId);

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function tick() {
    secondsRef.current -= 1;
    setSecondsRemaining(secondsRef.current);
    setElapsedSeconds((s) => s + 1);
    if (secondsRef.current <= 0) {
      clearTimer();
      finish();
    }
  }

  function startTimer() {
    clearTimer();
    intervalRef.current = setInterval(tick, 1000);
  }

  function handleStart() {
    const minutes = customMinutes ? Number(customMinutes) : presetMinutes;
    if (!minutes || minutes <= 0) return;
    const seconds = Math.round(minutes * 60);
    secondsRef.current = seconds;
    setTotalSeconds(seconds);
    setSecondsRemaining(seconds);
    setElapsedSeconds(0);
    setPhase("running");
    startTimer();

    setMessageLoading(true);
    fetchInvigilatorMessage("start", course?.title, 0)
      .then(setMessage)
      .catch(() => setMessage("Let's get started."))
      .finally(() => setMessageLoading(false));
  }

  function handlePause() {
    clearTimer();
    setPhase("paused");
  }

  function handleResume() {
    setPhase("running");
    startTimer();
  }

  function finish() {
    setPhase("complete");
    const minutes = Math.round(elapsedSeconds / 60) || Math.round(totalSeconds / 60);
    setMessageLoading(true);
    fetchInvigilatorMessage("end", course?.title, minutes)
      .then(setMessage)
      .catch(() => setMessage("Nice work finishing that session."))
      .finally(() => setMessageLoading(false));
  }

  function handleEnd() {
    clearTimer();
    finish();
  }

  function handleRestart() {
    clearTimer();
    setPhase("setup");
    setMessage(null);
  }

  const invigilatorState: InvigilatorState =
    phase === "complete" ? "celebrating" : phase === "running" ? "focus" : messageLoading ? "thinking" : "greeting";

  const progressPct = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;
  const minutesLabel = `${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, "0")}`;

  if (phase === "setup") {
    return (
      <Reveal className="max-w-md mx-auto flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-3">
          <AIInvigilator state="idle" size={72} />
          <h1 className="font-heading text-2xl font-semibold">Focus session</h1>
          <p className="text-sm text-muted-foreground">
            A distraction-free timer. Pick a subject and a duration, and Clarity will check in when you&apos;re done.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex flex-col gap-2">
            <label htmlFor="focus-course" className="text-sm font-medium">
              Subject
            </label>
            <select
              id="focus-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Duration</span>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((p) => (
              <Button
                key={p}
                type="button"
                variant={presetMinutes === p && !customMinutes ? "default" : "outline"}
                onClick={() => {
                  setPresetMinutes(p);
                  setCustomMinutes("");
                }}
              >
                {p} min
              </Button>
            ))}
            <input
              type="number"
              min={1}
              placeholder="Custom"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-24 rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <Button size="lg" onClick={handleStart}>
          Start focus session
        </Button>
      </Reveal>
    );
  }

  if (phase === "complete") {
    const minutes = Math.round(elapsedSeconds / 60);
    return (
      <Reveal variant="scaleIn" className="max-w-md mx-auto flex flex-col items-center gap-6 text-center">
        <AIInvigilator state="celebrating" size={88} />
        <div>
          <h1 className="font-heading text-2xl font-semibold">Session complete</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {minutes} minute{minutes === 1 ? "" : "s"} of focused work{course ? ` on ${course.title}` : ""}.
          </p>
        </div>
        <InvigilatorBubble message={message ?? ""} loading={messageLoading} className="max-w-sm" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRestart}>
            Start another session
          </Button>
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal className="max-w-md mx-auto flex flex-col items-center gap-6 text-center">
      <AIInvigilator state={invigilatorState} size={72} />
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <RadialProgress
            value={progressPct}
            size={160}
            strokeWidth={10}
            label={minutesLabel}
            sublabel={course?.title}
          />
          <div className="flex gap-2">
            {phase === "running" ? (
              <Button variant="outline" onClick={handlePause}>
                <PauseIcon /> Pause
              </Button>
            ) : (
              <Button variant="outline" onClick={handleResume}>
                <PlayIcon /> Resume
              </Button>
            )}
            <Button variant="outline" onClick={handleEnd}>
              <SquareIcon /> End session
            </Button>
            {course && (
              <Button variant="ai" asChild>
                <Link href={`/tutor/${course.id}`}>
                  <MessageSquareIcon /> Ask Clarity
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {message && <InvigilatorBubble message={message} loading={messageLoading} className="max-w-sm" />}
    </Reveal>
  );
}
