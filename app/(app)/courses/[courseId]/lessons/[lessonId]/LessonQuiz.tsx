"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizCard, type QuizItem } from "@/components/QuizCard";

export function LessonQuiz({
  courseId,
  lessonId,
  conceptTag,
}: {
  courseId: string;
  lessonId: string;
  conceptTag: string;
}) {
  const [items, setItems] = useState<QuizItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, lessonId, conceptTag, difficulty: 3, count: 3 }),
      });
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  if (!items) {
    return (
      <Button onClick={generate} disabled={loading}>
        {loading ? "Generating quiz…" : "Take the lesson quiz"}
      </Button>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Couldn&apos;t generate a quiz — try again.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <QuizCard key={item.id} item={item} />
      ))}
    </div>
  );
}
