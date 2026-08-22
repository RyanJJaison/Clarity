"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AIInvigilator } from "./AIInvigilator";
import { InvigilatorBubble, InvigilatorAction } from "./InvigilatorBubble";

interface DashboardGreetingProps {
  subject?: string;
  todaysFocusHref: string;
}

/**
 * A one-time, real greeting from the AI Invigilator when the dashboard
 * loads — grounded in the student's actual due-card count (fetched
 * server-side by the API route), never fabricated. Fetched once on mount,
 * not polled or refreshed continuously.
 */
export function DashboardGreeting({ subject, todaysFocusHref }: DashboardGreetingProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/focus/encourage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: "start", subject }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setMessage(data.message ?? "Welcome back.");
      })
      .catch(() => {
        if (!cancelled) setMessage("Welcome back.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subject]);

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3">
      <AIInvigilator state={loading ? "thinking" : "greeting"} size={56} />
      <InvigilatorBubble message={message ?? ""} loading={loading}>
        <InvigilatorAction asChild>
          <Link href={todaysFocusHref}>Continue</Link>
        </InvigilatorAction>
        <InvigilatorAction onClick={() => setDismissed(true)}>Dismiss</InvigilatorAction>
      </InvigilatorBubble>
    </div>
  );
}
