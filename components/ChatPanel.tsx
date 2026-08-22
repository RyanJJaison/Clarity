"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AIInvigilator } from "@/components/ai-invigilator/AIInvigilator";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface QuickAction {
  label: string;
  prompt: string;
}

interface ChatPanelProps {
  endpoint: string;
  body: Record<string, unknown>;
  initialMessages?: ChatMessage[];
  placeholder?: string;
  /** One-click prompts shown above the input (e.g. "Explain", "Give an example"). */
  quickActions?: QuickAction[];
  /** Show "Explain differently" / "Ask a follow-up" under each assistant reply. */
  showMessageActions?: boolean;
}

export function ChatPanel({
  endpoint,
  body,
  initialMessages = [],
  placeholder,
  quickActions,
  showMessageActions = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        const errorText = await res.text();
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${res.status} ${errorText}` }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: assistantText }]);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">{placeholder ?? "Say hello to get started."}</p>
        )}
        {messages.map((m, i) => {
          const isStreamingThisMessage = streaming && i === messages.length - 1 && m.role === "assistant";
          const isLastAssistant = m.role === "assistant" && i === messages.length - 1 && !streaming;
          return (
            <div key={i} className={cn("flex flex-col gap-1.5", m.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-[var(--glass-border)] bg-surface-glass backdrop-blur-[var(--glass-blur)]"
                )}
              >
                {isStreamingThisMessage && !m.content ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <AIInvigilator state="thinking" size={20} />
                    <span className="animate-pulse">Thinking…</span>
                  </span>
                ) : (
                  m.content
                )}
              </div>
              {showMessageActions && isLastAssistant && m.content && (
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="xs" onClick={() => send("Can you explain that differently?")}>
                    Explain differently
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => send("Can you say more about that?")}>
                    Ask a follow-up
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {quickActions && quickActions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="glass"
              size="xs"
              disabled={streaming}
              onClick={() => send(action.prompt)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex gap-2 border-t p-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Type a message…"
          className="min-h-10 resize-none"
          rows={1}
        />
        <Button type="submit" disabled={streaming || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
