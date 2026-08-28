import { describe, expect, it } from "vitest";
import {
  CHUNK_SIZE_CHARS,
  MIN_TAIL_CHARS,
  OVERLAP_CHARS,
  chunkText,
  formatContext,
  splitIntoSentences,
  type RetrievedChunk,
} from "@/lib/rag";

/** A paragraph of `sentenceCount` sentences, each tagged so it can be located. */
function makeParagraph(tag: string, sentenceCount: number, filler = 12): string {
  return Array.from(
    { length: sentenceCount },
    (_, i) => `${tag}${i} ${"word ".repeat(filler).trim()}.`
  ).join(" ");
}

function makeDocument(paragraphCount: number, sentencesPerParagraph = 8): string {
  return Array.from({ length: paragraphCount }, (_, i) =>
    makeParagraph(`p${i}s`, sentencesPerParagraph)
  ).join("\n\n");
}

describe("chunkText — empty and trivial input", () => {
  it("returns no chunks for empty or whitespace-only text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n\t  ")).toEqual([]);
  });

  it("returns a single chunk for text well under the ceiling", () => {
    const chunks = chunkText("Mitochondria make ATP. They are organelles.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("Mitochondria make ATP. They are organelles.");
    expect(chunks[0].position).toBe(0);
  });

  it("collapses spaces and tabs but keeps paragraphs apart", () => {
    const chunks = chunkText("First   para.\n\nSecond\tpara.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("First para. Second para.");
  });

  it("flattens soft line wraps inside a paragraph", () => {
    const chunks = chunkText("A sentence that\nwraps across lines.");
    expect(chunks[0].text).toBe("A sentence that wraps across lines.");
  });
});

describe("chunkText — sentences are never split across boundaries", () => {
  it("ends every chunk at a sentence terminator", () => {
    const chunks = chunkText(makeDocument(12));
    expect(chunks.length).toBeGreaterThan(1);

    for (const chunk of chunks) {
      expect(chunk.text.trim()).toMatch(/[.!?]["')\]]*$/);
    }
  });

  it("never leaves a sentence's opening tag orphaned from its terminator", () => {
    // Each sentence is "pXsN word word ... ." — if a boundary cut mid-sentence,
    // a chunk would contain a tag with no following period.
    const chunks = chunkText(makeDocument(10));

    for (const chunk of chunks) {
      const tags = chunk.text.match(/p\d+s\d+/g) ?? [];
      for (const tag of tags) {
        const after = chunk.text.slice(chunk.text.indexOf(tag) + tag.length);
        expect(after).toContain(".");
      }
    }
  });

  it("keeps each source sentence intact inside at least one chunk", () => {
    const document = makeDocument(8);
    const chunks = chunkText(document);
    const sentences = splitIntoSentences(document.replace(/\n+/g, " "));

    for (const sentence of sentences) {
      expect(chunks.some((c) => c.text.includes(sentence))).toBe(true);
    }
  });

  it("does not split a paragraph that fits, even alongside others", () => {
    const paragraph = makeParagraph("keepme", 4);
    const chunks = chunkText([paragraph, makeParagraph("other", 40)].join("\n\n"));
    expect(chunks.some((c) => c.text.includes(paragraph))).toBe(true);
  });
});

describe("chunkText — size stays near the target ceiling", () => {
  it("no chunk greatly exceeds the ceiling", () => {
    const chunks = chunkText(makeDocument(20));
    // A merged tail can push one chunk slightly over; nothing should blow past it.
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(CHUNK_SIZE_CHARS + MIN_TAIL_CHARS + 1);
    }
  });

  it("fills chunks rather than emitting many small ones", () => {
    const chunks = chunkText(makeDocument(20));
    expect(chunks.length).toBeGreaterThan(1);

    // Every chunk but the last should be reasonably full.
    for (const chunk of chunks.slice(0, -1)) {
      expect(chunk.text.length).toBeGreaterThan(CHUNK_SIZE_CHARS * 0.5);
    }
  });

  it("splits an oversized single paragraph by sentence", () => {
    const chunks = chunkText(makeParagraph("solo", 60));
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(CHUNK_SIZE_CHARS + MIN_TAIL_CHARS + 1);
      expect(chunk.text.trim()).toMatch(/\.$/);
    }
  });

  it("hard-splits a single sentence longer than the ceiling as a last resort", () => {
    const monster = `${"word ".repeat(900).trim()}.`;
    expect(monster.length).toBeGreaterThan(CHUNK_SIZE_CHARS);

    const chunks = chunkText(monster);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(CHUNK_SIZE_CHARS + MIN_TAIL_CHARS + 1);
    }
  });

  it("respects a custom chunkSize", () => {
    const chunks = chunkText(makeDocument(6), { chunkSize: 400, overlap: 50 });
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(400 + MIN_TAIL_CHARS + 1);
    }
  });
});

describe("chunkText — overlap carries into the next chunk", () => {
  it("starts each chunk after the first with text from the previous chunk", () => {
    const chunks = chunkText(makeDocument(20));
    expect(chunks.length).toBeGreaterThan(1);

    for (let i = 1; i < chunks.length; i++) {
      const previous = chunks[i - 1].text;
      // The first sentence of this chunk must appear in the previous one.
      const firstSentence = splitIntoSentences(chunks[i].text)[0];
      expect(previous).toContain(firstSentence);
    }
  });

  it("carries roughly the configured number of overlap characters", () => {
    const chunks = chunkText(makeDocument(20));

    for (let i = 1; i < chunks.length; i++) {
      const previous = chunks[i - 1].text;
      const sentences = splitIntoSentences(chunks[i].text);

      let carried = 0;
      for (const sentence of sentences) {
        if (!previous.includes(sentence)) break;
        carried += sentence.length + 1;
      }

      expect(carried).toBeGreaterThanOrEqual(OVERLAP_CHARS);
      expect(carried).toBeLessThanOrEqual(OVERLAP_CHARS * 2 + 2);
    }
  });

  it("starts the overlap at a sentence boundary", () => {
    const chunks = chunkText(makeDocument(20));

    for (let i = 1; i < chunks.length; i++) {
      // Sentences here begin with a "pXsN" tag; a mid-sentence overlap would
      // start with a bare filler word instead.
      expect(chunks[i].text).toMatch(/^p\d+s\d+/);
    }
  });

  it("emits no overlap when overlap is zero", () => {
    const chunks = chunkText(makeDocument(12), { overlap: 0 });

    for (let i = 1; i < chunks.length; i++) {
      const firstSentence = splitIntoSentences(chunks[i].text)[0];
      expect(chunks[i - 1].text).not.toContain(firstSentence);
    }
  });

  it("does not duplicate an entire chunk as overlap", () => {
    const chunks = chunkText(makeDocument(20));
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].text).not.toBe(chunks[i - 1].text);
      expect(chunks[i].text.includes(chunks[i - 1].text)).toBe(false);
    }
  });
});

describe("chunkText — no tiny trailing chunk", () => {
  it("merges a short trailing fragment into the previous chunk", () => {
    // Tuned so the final unit is a short sentence that would otherwise stand alone.
    const document = `${makeParagraph("body", 40)}\n\nTiny tail.`;
    const chunks = chunkText(document);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.at(-1)!.text).toContain("Tiny tail.");
    // The tail must not be a chunk of its own.
    expect(chunks.some((c) => c.text.trim() === "Tiny tail.")).toBe(false);
  });

  it("never emits a chunk whose new content is below the tail threshold", () => {
    for (const paragraphs of [7, 9, 11, 13, 17]) {
      const chunks = chunkText(makeDocument(paragraphs));
      if (chunks.length < 2) continue;

      const last = chunks.at(-1)!;
      const previous = chunks.at(-2)!;

      // Strip the overlap prefix to measure only content new to this chunk.
      const newContent = splitIntoSentences(last.text)
        .filter((s) => !previous.text.includes(s))
        .join(" ");

      expect(newContent.length).toBeGreaterThanOrEqual(MIN_TAIL_CHARS);
    }
  });

  it("keeps a single short document as one chunk rather than merging into nothing", () => {
    const chunks = chunkText("Short.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("Short.");
  });
});

describe("chunkText — positions", () => {
  it("numbers positions sequentially from zero", () => {
    const chunks = chunkText(makeDocument(20));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((c) => c.position)).toEqual(chunks.map((_, i) => i));
  });

  it("renumbers without a gap after a tail merge", () => {
    const chunks = chunkText(`${makeParagraph("body", 40)}\n\nTiny tail.`);
    expect(chunks.map((c) => c.position)).toEqual(chunks.map((_, i) => i));
  });

  it("is deterministic across runs", () => {
    const document = makeDocument(14);
    expect(chunkText(document)).toEqual(chunkText(document));
  });
});

describe("chunkText — option validation", () => {
  it.each([
    { chunkSize: 0 },
    { chunkSize: -1 },
    { overlap: -1 },
    { chunkSize: 100, overlap: 100 },
    { chunkSize: 100, overlap: 500 },
  ])("rejects invalid options %j", (options) => {
    expect(() => chunkText("some text", options)).toThrow();
  });
});

describe("splitIntoSentences", () => {
  it("splits on sentence terminators", () => {
    expect(splitIntoSentences("One. Two! Three?")).toEqual(["One.", "Two!", "Three?"]);
  });

  it("does not split decimals", () => {
    expect(splitIntoSentences("It took 1.5 to 2 billion years.")).toEqual([
      "It took 1.5 to 2 billion years.",
    ]);
  });

  it("does not split on common abbreviations", () => {
    expect(splitIntoSentences("Organelles, e.g. mitochondria, make ATP.")).toEqual([
      "Organelles, e.g. mitochondria, make ATP.",
    ]);
  });

  it("keeps trailing quotes and brackets with the sentence", () => {
    expect(splitIntoSentences('He said "yes." Then he left.')).toEqual([
      'He said "yes."',
      "Then he left.",
    ]);
  });

  it("returns an unterminated tail as its own sentence", () => {
    expect(splitIntoSentences("Complete. Incomplete")).toEqual(["Complete.", "Incomplete"]);
  });

  it("returns nothing for empty input", () => {
    expect(splitIntoSentences("")).toEqual([]);
    expect(splitIntoSentences("   ")).toEqual([]);
  });
});

describe("formatContext (unchanged behaviour)", () => {
  it("numbers chunks for prompt injection", () => {
    const chunks: RetrievedChunk[] = [
      { chunkText: "first", similarity: 0.9 },
      { chunkText: "second", similarity: 0.8 },
    ];
    expect(formatContext(chunks)).toBe("[1] first\n\n[2] second");
  });

  it("reports when nothing was retrieved", () => {
    expect(formatContext([])).toBe("(no relevant context found)");
  });
});
