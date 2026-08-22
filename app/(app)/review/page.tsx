"use client";

import { useEffect, useState } from "react";
import { FlashcardReview, type DueCard } from "@/components/FlashcardReview";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewPage() {
  const [cards, setCards] = useState<DueCard[] | null>(null);

  useEffect(() => {
    fetch("/api/srs/due")
      .then((r) => r.json())
      .then((data) => setCards(data.cards ?? []));
  }, []);

  return (
    <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Review queue</h1>
        <p className="text-sm text-muted-foreground">Cards due today, pulled in from every course.</p>
      </div>

      {cards === null ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <FlashcardReview cards={cards} />
      )}
    </main>
  );
}
