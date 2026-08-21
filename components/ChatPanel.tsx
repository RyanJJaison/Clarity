"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  endpoint: string;
  body: Record<string, unknown>;
  initialMessages?: ChatMessage[];
  placeholder?: string;
}

export function ChatPanel({ endpoint, body, initialMessages = [], placeholder }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
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
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
              m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted"
            )}
          >
            {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
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
