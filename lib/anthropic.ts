import Anthropic from "@anthropic-ai/sdk";

export const MODELS = {
  smart: "claude-sonnet-5",
  fast: "claude-haiku-4-5-20251001",
} as const;

const hasKey = !!process.env.ANTHROPIC_API_KEY;

export const anthropic = hasKey
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export const isAnthropicMocked = !hasKey;

/**
 * Non-streaming completion helper. Returns a clearly-labeled mock when
 * ANTHROPIC_API_KEY is unset so the app keeps running without a real key.
 */
export async function complete(params: {
  model?: string;
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  if (!anthropic) {
    return mockResponse(params.prompt);
  }

  const message = await anthropic.messages.create({
    model: params.model ?? MODELS.smart,
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
  });

  const block = message.content[0];
  return block?.type === "text" ? block.text : "";
}

/**
 * Streaming completion helper for chat surfaces (tutor chat, roleplay).
 * Yields text chunks. Falls back to a fake token-by-token stream of a mock
 * reply when no API key is configured.
 */
export async function* streamComplete(params: {
  model?: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): AsyncGenerator<string> {
  if (!anthropic) {
    const mock = mockResponse(params.messages.at(-1)?.content ?? "");
    for (const word of mock.split(" ")) {
      yield word + " ";
    }
    return;
  }

  const stream = anthropic.messages.stream({
    model: params.model ?? MODELS.smart,
    max_tokens: 1024,
    system: params.system,
    messages: params.messages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

function mockResponse(prompt: string): string {
  return `[MOCK RESPONSE — ANTHROPIC_API_KEY is not set] This is a placeholder reply standing in for Claude. Your input was: "${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}". Add a real ANTHROPIC_API_KEY to .env.local to get live responses.`;
}
