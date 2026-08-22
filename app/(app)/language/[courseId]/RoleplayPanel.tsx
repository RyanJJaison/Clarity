"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatPanel } from "@/components/ChatPanel";

const SUGGESTED_SCENARIOS = ["Ordering food at a restaurant", "A job interview", "Small talk with a neighbor"];

export function RoleplayPanel({ courseId }: { courseId: string }) {
  const [scenario, setScenario] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (!scenario) {
    return (
      <div className="flex-1 flex flex-col gap-4 items-start">
        <p className="text-sm font-medium">Pick a scenario to start:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_SCENARIOS.map((s) => (
            <Button key={s} variant="outline" onClick={() => setScenario(s)}>
              {s}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 w-full max-w-md">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Or describe your own scenario…"
          />
          <Button onClick={() => draft.trim() && setScenario(draft.trim())}>Start</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col border rounded-lg">
      <div className="border-b px-3 py-2 text-sm text-muted-foreground">Scenario: {scenario}</div>
      <div className="flex-1 min-h-0">
        <ChatPanel
          endpoint="/api/language/roleplay"
          body={{ courseId, scenario }}
          placeholder="Say something to start the roleplay."
        />
      </div>
    </div>
  );
}
