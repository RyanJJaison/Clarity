const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3";
export const EMBEDDING_DIM = 1024;

const hasKey = !!process.env.VOYAGE_API_KEY;
export const isEmbeddingsMocked = !hasKey;

/**
 * Embeds a batch of text chunks via Voyage AI. Returns clearly-labeled
 * deterministic mock vectors when VOYAGE_API_KEY is unset so ingestion and
 * pgvector search keep working end-to-end without a real key.
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (!hasKey) {
    return texts.map(mockEmbedding);
  }

  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: texts, model: MODEL, input_type: "document" }),
  });

  if (!res.ok) {
    throw new Error(`Voyage embeddings request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data.map((d) => d.embedding);
}

// Deterministic hash-based pseudo-embedding — not semantically meaningful,
// only good enough to keep pgvector queries and the ingest pipeline running.
function mockEmbedding(text: string): number[] {
  const vec = new Array(EMBEDDING_DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % EMBEDDING_DIM] += text.charCodeAt(i);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
