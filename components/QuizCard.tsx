"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface QuizItem {
  id: string;
  question: string;
  item_type: "mcq" | "short_answer" | "fill_blank";
  options: string[] | null;
  explanation: string | null;
}

interface GradeResult {
  correct: boolean;
  feedback: string;
}

export function QuizCard({
  item,
  onGraded,
}: {
  item: QuizItem;
  onGraded?: (result: GradeResult) => void;
}) {
  const [response, setResponse] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!response.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizItemId: item.id, response }),
      });
      const data: GradeResult = await res.json();
      setResult(data);
      onGraded?.(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{item.question}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {item.item_type === "mcq" && item.options ? (
          <div className="flex flex-col gap-2">
            {item.options.map((opt) => (
              <Button
                key={opt}
                type="button"
                variant={response === opt ? "default" : "outline"}
                className="justify-start"
                onClick={() => setResponse(opt)}
                disabled={!!result}
              >
                {opt}
              </Button>
            ))}
          </div>
        ) : (
          <Input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Your answer"
            disabled={!!result}
          />
        )}

        {result && (
          <p className={cn("text-sm", result.correct ? "text-emerald-600" : "text-destructive")}>
            {result.correct ? "Correct — " : "Not quite — "}
            {result.feedback}
          </p>
        )}
      </CardContent>
      <CardFooter>
        {!result && (
          <Button onClick={submit} disabled={loading || !response.trim()}>
            {loading ? "Checking…" : "Submit"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
