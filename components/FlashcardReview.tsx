"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export interface DueCard {
  id: string;
  quiz_item_id: string;
  quiz_items: {
    question: string;
    answer: string;
    explanation: string | null;
  } | null;
}

export function FlashcardReview({ cards }: { cards: DueCard[] }) {
  const [queue, setQueue] = useState(cards);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const current = queue[0];

  async function answer(correct: boolean) {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/srs/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizItemId: current.quiz_item_id, correct, confident: true }),
      });
      setQueue((q) => q.slice(1));
      setRevealed(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!current) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nothing due for review right now — nice work.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-base font-medium">{current.quiz_items?.question}</CardTitle>
      </CardHeader>
      <CardContent>
        {revealed ? (
          <div className="text-sm">
            <p className="font-medium">{current.quiz_items?.answer}</p>
            {current.quiz_items?.explanation && (
              <p className="mt-2 text-muted-foreground">{current.quiz_items.explanation}</p>
            )}
          </div>
        ) : (
          <Button variant="outline" onClick={() => setRevealed(true)}>
            Reveal answer
          </Button>
        )}
      </CardContent>
      {revealed && (
        <CardFooter className="gap-2">
          <Button variant="destructive" disabled={submitting} onClick={() => answer(false)}>
            Got it wrong
          </Button>
          <Button disabled={submitting} onClick={() => answer(true)}>
            Got it right
          </Button>
        </CardFooter>
      )}
      <p className="px-6 pb-4 text-xs text-muted-foreground">{queue.length} card(s) left in this session</p>
    </Card>
  );
}
