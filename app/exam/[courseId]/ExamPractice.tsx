"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizCard, type QuizItem } from "@/components/QuizCard";
import type { CourseOutline } from "@/types/db";

interface Readiness {
  readinessScore: number;
  weakConcepts: string[];
  rationale: string;
}

export function ExamPractice({ courseId, outline }: { courseId: string; outline: CourseOutline | null }) {
  const [items, setItems] = useState<QuizItem[] | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(false);

  const conceptTags = Array.from(
    new Set(outline?.modules.flatMap((m) => m.lessons.flatMap((l) => l.conceptTags)) ?? [])
  );

  async function startTest() {
    setLoading(true);
    try {
      const results = await Promise.all(
        conceptTags.slice(0, 3).map((tag) =>
          fetch("/api/quiz/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId, conceptTag: tag, difficulty: 3, count: 2 }),
          }).then((r) => r.json())
        )
      );
      setItems(results.flatMap((r) => r.items ?? []));
    } finally {
      setLoading(false);
    }
  }

  async function checkReadiness() {
    setLoading(true);
    try {
      const res = await fetch("/api/exam/predict-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      setReadiness(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Readiness score</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {readiness ? (
            <>
              <p className="text-3xl font-semibold">{readiness.readinessScore}/100</p>
              <p className="text-sm text-muted-foreground">{readiness.rationale}</p>
              {readiness.weakConcepts.length > 0 && (
                <p className="text-sm">
                  Focus on: <span className="font-medium">{readiness.weakConcepts.join(", ")}</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Take a practice test, then check your readiness.</p>
          )}
          <Button variant="outline" onClick={checkReadiness} disabled={loading} className="self-start">
            {loading ? "Checking…" : "Refresh readiness score"}
          </Button>
        </CardContent>
      </Card>

      {!items ? (
        <Button onClick={startTest} disabled={loading || conceptTags.length === 0} size="lg" className="self-start">
          {loading ? "Building test…" : "Start a practice test"}
        </Button>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <QuizCard key={item.id} item={item} onGraded={checkReadiness} />
          ))}
        </div>
      )}
    </div>
  );
}
