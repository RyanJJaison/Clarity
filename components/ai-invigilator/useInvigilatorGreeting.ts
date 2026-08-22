"use client";

import { useEffect, useState } from "react";

/**
 * Fetches a real, one-time AI Invigilator greeting on mount — grounded in
 * the student's actual due-card count (computed server-side). Never
 * fabricated, never polled.
 */
export function useInvigilatorGreeting(subject?: string) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return { message, loading };
}
