"use client";

import { useRef, useState } from "react";

/**
 * Shows a transient message (an Easter egg's response) for a few seconds.
 * Purely local component state — matches Section 15: decorative
 * interactions never touch the backend.
 */
export function useEasterEggMessage(durationMs = 2600) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show(text: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(text);
    timeoutRef.current = setTimeout(() => setMessage(null), durationMs);
  }

  return { message, show };
}
