export interface Chunk {
  text: string;
  position: number;
}

const CHUNK_SIZE_CHARS = 2000; // ~500 tokens
const OVERLAP_CHARS = 200; // ~50 tokens

/** Splits raw text into overlapping chunks for embedding. */
export function chunkText(text: string): Chunk[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks: Chunk[] = [];
  let start = 0;
  let position = 0;

  while (start < clean.length) {
    const end = Math.min(start + CHUNK_SIZE_CHARS, clean.length);
    chunks.push({ text: clean.slice(start, end), position: position++ });
    if (end === clean.length) break;
    start = end - OVERLAP_CHARS;
  }

  return chunks;
}

export interface RetrievedChunk {
  chunkText: string;
  similarity: number;
}

/** Formats retrieved chunks for injection into a prompt's context section. */
export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "(no relevant context found)";
  return chunks.map((c, i) => `[${i + 1}] ${c.chunkText}`).join("\n\n");
}
