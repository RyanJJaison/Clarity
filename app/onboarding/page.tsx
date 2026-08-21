"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Level, Mode } from "@/types/db";

const MODES: { value: Mode; title: string; description: string }[] = [
  { value: "general", title: "General Tutor", description: "Turn any material into a structured course." },
  { value: "exam", title: "Exam Prep", description: "Adaptive practice tests with a readiness score." },
  { value: "language", title: "Language Learning", description: "Roleplay conversations with corrections." },
];

const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [level, setLevel] = useState<Level>("beginner");
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    if (!mode) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, default_level: level });
    }

    setSaving(false);
    router.push(`/courses/new?mode=${mode}&level=${level}`);
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold">Pick how you want to learn</h1>
          <p className="text-muted-foreground text-sm mt-1">You can start more courses in other modes later.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {MODES.map((m) => (
            <Card
              key={m.value}
              role="button"
              tabIndex={0}
              onClick={() => setMode(m.value)}
              className={cn("cursor-pointer transition-colors", mode === m.value && "border-primary ring-1 ring-primary")}
            >
              <CardHeader>
                <CardTitle className="text-base">{m.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{m.description}</CardContent>
            </Card>
          ))}
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Starting level</p>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <Button key={l} type="button" variant={level === l ? "default" : "outline"} onClick={() => setLevel(l)}>
                {l}
              </Button>
            ))}
          </div>
        </div>

        <Button size="lg" disabled={!mode || saving} onClick={handleContinue} className="self-start">
          {saving ? "Saving…" : "Continue"}
        </Button>
      </div>
    </main>
  );
}
