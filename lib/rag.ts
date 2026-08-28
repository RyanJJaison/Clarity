export interface Chunk {
  text: string;
  position: number;
}

export const CHUNK_SIZE_CHARS = 2000; // ~500 tokens
export const OVERLAP_CHARS = 200; // ~50 tokens
/** A trailing fragment shorter than this is merged back into the previous chunk. */
export const MIN_TAIL_CHARS = 120;

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
  minTail?: number;
}

/**
 * Splits raw text into overlapping, semantically-bounded chunks for embedding.
 *
 * Structure-aware rather than fixed-width: paragraphs are the primary unit, and
 * a paragraph is only broken into sentences when it alone exceeds the size
 * ceiling. Chunk bodies therefore always end on a sentence or paragraph
 * boundary, so an embedding never represents half a thought.
 *
 * Consecutive chunks overlap by ~`overlap` characters, taken as whole trailing
 * sentences of the previous chunk where possible, so a question whose answer
 * straddles a boundary can still be answered by one chunk.
 *
 * The one case that can still split a sentence is a single sentence longer than
 * `chunkSize`, which cannot be represented otherwise; it is hard-split at word
 * boundaries as a last resort.
 */
export function chunkText(text: string, options: ChunkOptions = {}): Chunk[] {
  const chunkSize = options.chunkSize ?? CHUNK_SIZE_CHARS;
  const overlap = options.overlap ?? OVERLAP_CHARS;
  const minTail = options.minTail ?? MIN_TAIL_CHARS;

  if (chunkSize <= 0) throw new Error("chunkSize must be positive");
  if (overlap < 0) throw new Error("overlap must not be negative");
  if (overlap >= chunkSize) throw new Error("overlap must be smaller than chunkSize");

  const units = toAtomicUnits(
    splitIntoParagraphs(normalizeWhitespace(text)),
    chunkSize,
    overlap
  );
  if (units.length === 0) return [];

  // Each chunk is an overlap prefix (carried from the previous chunk) plus a
  // body of whole units. They are tracked separately so the tiny-tail check can
  // measure only the new content, not the duplicated overlap.
  const packed: { prefix: string; body: string }[] = [];
  let i = 0;

  while (i < units.length) {
    const previous = packed.at(-1);
    const prefix = previous ? overlapPrefix(joinChunk(previous), overlap) : "";
    const prefixCost = prefix ? prefix.length + 1 : 0;

    let body = "";
    while (i < units.length) {
      const candidate = body ? `${body} ${units[i]}` : units[i];
      // Always take at least one unit, otherwise a unit larger than the
      // remaining budget would stall the loop forever.
      if (body && prefixCost + candidate.length > chunkSize) break;
      body = candidate;
      i++;
    }

    // A unit that alone fills the chunk leaves no room for overlap. Keeping the
    // body whole matters more than the overlap, so the prefix is dropped rather
    // than blowing past chunkSize or cutting the unit.
    const keepsPrefix = !prefix || prefix.length + 1 + body.length <= chunkSize;
    packed.push({ prefix: keepsPrefix ? prefix : "", body });
  }

  // A short final fragment is worth less as its own embedding than as extra
  // context on the previous chunk. Merging can push that chunk slightly past
  // chunkSize, which is the accepted trade for not emitting a near-empty chunk.
  if (packed.length > 1) {
    const tail = packed.at(-1)!;
    if (tail.body.length < minTail) {
      packed.pop();
      const previous = packed.at(-1)!;
      previous.body = `${previous.body} ${tail.body}`;
    }
  }

  return packed.map((chunk, position) => ({ text: joinChunk(chunk), position }));
}

function joinChunk(chunk: { prefix: string; body: string }): string {
  return chunk.prefix ? `${chunk.prefix} ${chunk.body}` : chunk.body;
}

/**
 * Collapses runs of spaces and tabs, but preserves blank lines, since those are
 * the paragraph boundaries the chunker keys off.
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Splits on blank lines, flattening soft line wraps inside each paragraph. */
function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

// Abbreviations whose trailing period is not a sentence end. Without this,
// "e.g. mitochondria" would be treated as a boundary. Decimals ("1.5") are
// already safe, since they have no whitespace after the period.
const ABBREVIATIONS = new Set([
  "e.g.", "i.e.", "etc.", "vs.", "cf.", "al.", "approx.", "fig.", "eq.", "no.",
  "dr.", "mr.", "mrs.", "ms.", "prof.", "st.", "jr.", "sr.",
]);

const SENTENCE_END_RE = /([.!?]+["')\]]*)\s+/g;

/** Splits text into sentences, tolerating common abbreviations. */
export function splitIntoSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const sentences: string[] = [];
  let start = 0;
  SENTENCE_END_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SENTENCE_END_RE.exec(trimmed)) !== null) {
    const candidate = trimmed.slice(start, match.index + match[1].length);
    if (endsWithAbbreviation(candidate)) continue;

    sentences.push(candidate.trim());
    start = SENTENCE_END_RE.lastIndex;
  }

  const tail = trimmed.slice(start).trim();
  if (tail) sentences.push(tail);

  return sentences.filter(Boolean);
}

function endsWithAbbreviation(candidate: string): boolean {
  const lastWord = candidate.split(/\s+/).at(-1)?.toLowerCase() ?? "";
  // A lone initial such as "J." is also not a sentence end.
  return ABBREVIATIONS.has(lastWord) || /^[a-z]\.$/.test(lastWord);
}

/**
 * Reduces paragraphs to units that each fit within `chunkSize`, splitting only
 * as far as necessary: paragraph, then sentence, then (rarely) words.
 */
function toAtomicUnits(paragraphs: string[], chunkSize: number, overlap: number): string[] {
  const units: string[] = [];
  // Hard-split pieces are capped below the ceiling so the overlap prefix still
  // fits alongside one of them; otherwise every such chunk would lose its
  // overlap to the size limit.
  const hardSplitTarget = Math.max(1, chunkSize - overlap);

  for (const paragraph of paragraphs) {
    if (paragraph.length <= chunkSize) {
      units.push(paragraph);
      continue;
    }

    for (const sentence of splitIntoSentences(paragraph)) {
      if (sentence.length <= chunkSize) {
        units.push(sentence);
      } else {
        units.push(...hardSplitLongSentence(sentence, hardSplitTarget));
      }
    }
  }

  return units;
}

/** Last resort for a single sentence longer than the ceiling: split on words. */
function hardSplitLongSentence(sentence: string, chunkSize: number): string[] {
  const pieces: string[] = [];
  let current = "";

  for (const word of sentence.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > chunkSize) {
      pieces.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) pieces.push(current);
  return pieces;
}

/**
 * Builds the overlap carried into the next chunk: whole trailing sentences of
 * the previous chunk totalling at least `overlap` characters.
 *
 * Falls back to a word-aligned character suffix when whole sentences would
 * either overshoot badly or duplicate the entire previous chunk (which happens
 * when that chunk is one long sentence).
 */
function overlapPrefix(previousText: string, overlap: number): string {
  if (overlap <= 0 || !previousText) return "";

  const sentences = splitIntoSentences(previousText);
  const selected: string[] = [];
  let length = 0;

  for (let i = sentences.length - 1; i >= 0; i--) {
    selected.unshift(sentences[i]);
    length += sentences[i].length + (selected.length > 1 ? 1 : 0);
    if (length >= overlap) break;
  }

  const candidate = selected.join(" ");
  if (candidate && candidate.length <= overlap * 2 && candidate.length < previousText.length) {
    return candidate;
  }

  const suffix = previousText.slice(-overlap);
  const firstSpace = suffix.indexOf(" ");
  return firstSpace === -1 ? suffix : suffix.slice(firstSpace + 1);
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

// ---------------------------------------------------------------------------
// Retrieval-fusion helpers used by the eval harness (scripts/eval-retrieval.ts)
// to compare retrieval methods in-memory. These will also back a future
// server-side hybrid (vector + keyword) search — see the RAG improvement
// plan for the next step.
// ---------------------------------------------------------------------------

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("vector length mismatch");
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Crude keyword relevance score: fraction of unique query terms that
 * appear in the candidate text, weighted by term frequency. Not meant to
 * replace Postgres full-text search (which uses proper stemming/ranking in
 * production) — this is a lightweight stand-in for local evaluation.
 */
export function keywordScore(query: string, text: string): number {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return 0;
  const textTokens = tokenize(text);
  const textCounts = new Map<string, number>();
  for (const t of textTokens) textCounts.set(t, (textCounts.get(t) ?? 0) + 1);

  let score = 0;
  for (const term of new Set(queryTerms)) {
    const count = textCounts.get(term) ?? 0;
    if (count > 0) score += 1 + Math.log(count);
  }
  return score / queryTerms.length;
}

function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((t) => t.length > 1) ?? []
  );
}

export interface RankedItem<T> {
  item: T;
  rank: number; // 1-based rank within this ranking
}

/**
 * Reciprocal Rank Fusion: combines multiple ranked lists of the same items
 * into a single ranking using only rank position (not raw scores), which
 * avoids the need to normalize incomparable scores (cosine similarity vs.
 * a keyword-match score) onto the same scale. k=60 is the standard constant
 * from the original RRF paper (Cormack et al.) and is not sensitive to
 * tuning in practice.
 */
export function reciprocalRankFusion<T>(
  rankings: RankedItem<T>[][],
  k = 60
): { item: T; score: number }[] {
  const scores = new Map<T, number>();
  for (const ranking of rankings) {
    for (const { item, rank } of ranking) {
      scores.set(item, (scores.get(item) ?? 0) + 1 / (k + rank));
    }
  }
  return [...scores.entries()]
    .map(([item, score]) => ({ item, score }))
    .sort((a, b) => b.score - a.score);
}
