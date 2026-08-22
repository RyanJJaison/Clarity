# Clarity — AI Adaptive Learning Companion

Ingest anything — a PDF, pasted notes, an article — and get a personalized tutor,
adaptive quizzes, spaced-repetition review, and exam or language coaching, all from
one engine instead of three disconnected tools.

## Status

Foundation scaffold: repo structure, Supabase schema, auth, and all three modes
(General Tutor / Exam Prep / Language Learning) are wired end-to-end against stub
data where a real API key isn't configured yet. See [Section 3.5 of the build spec](#)
for what's MVP vs Phase 2 vs Stretch.

## Tech stack

- Next.js 16 (App Router) + TypeScript, single repo/deploy
- Tailwind CSS + shadcn/ui (Radix)
- Supabase (Postgres + Auth + `pgvector`)
- Anthropic Claude (`claude-sonnet-5` for generation/chat, `claude-haiku-4-5` for grading/extraction)
- Voyage AI for embeddings
- Vitest for unit tests

## Architecture

```
Browser ── Next.js App Router ──┬── app/api/**  (route handlers: ingest, chat, quiz, srs, dashboard)
                                 ├── lib/**      (Anthropic + Voyage wrappers, RAG, SRS, difficulty)
                                 └── Supabase (Postgres + pgvector + Auth), via lib/supabase/{client,server}.ts
```

- `lib/srs.ts` and `lib/difficulty.ts` are pure functions — unit tested in `tests/`.
- `lib/anthropic.ts` and `lib/embeddings.ts` transparently fall back to clearly-labeled
  mock responses when `ANTHROPIC_API_KEY` / `VOYAGE_API_KEY` are unset, so the app runs
  end-to-end without real keys. Supabase itself (auth + database) has no mock — you need
  a real (free-tier) Supabase project for anything past the landing page.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is enough).
   - In the SQL editor, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
     This creates all tables, enables `pgvector`, sets up Row Level Security policies, and
     adds the `match_content_chunks` similarity-search function used by the tutor chat.
   - Copy the Project URL, anon key, and service role key from Settings → API.

3. **Configure environment variables** — copy `.env.example` to `.env.local` and fill in:
   ```
   ANTHROPIC_API_KEY=       # optional at first — falls back to a labeled mock
   VOYAGE_API_KEY=          # optional at first — falls back to a labeled mock
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
   `.env.local` is gitignored — never commit real keys.

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Sign up, pick a mode, paste some
   text, and the outline/chat/quiz flow works immediately — using mock AI responses until
   you add real `ANTHROPIC_API_KEY` / `VOYAGE_API_KEY` values.

5. **Run tests / lint / typecheck**
   ```bash
   npm test
   npm run lint
   npx tsc --noEmit
   ```

## Repo structure

```
app/
├── (auth)/login, (auth)/signup      # Supabase email/password auth
├── onboarding                       # pick mode + starting level
├── courses/new                      # ingest content → generate outline
├── courses/[courseId]               # outline view
├── courses/[courseId]/lessons/[id]  # lesson + quiz
├── tutor/[courseId]                 # Socratic RAG chat (General Tutor)
├── exam/[courseId]                  # practice tests + readiness score
├── language/[courseId]              # roleplay chat + vocab SRS
├── review                           # SRS due-cards queue (all modes)
├── dashboard                        # mastery bars, streak, due count
└── api/**                           # route handlers, see below

lib/
├── supabase/{client,server}.ts      # browser / server / admin Supabase clients
├── anthropic.ts                     # Claude wrapper (streaming + non-streaming, mock fallback)
├── embeddings.ts                    # Voyage AI wrapper (mock fallback)
├── rag.ts                           # chunking + context formatting
├── srs.ts                           # SM-2 spaced repetition (pure functions)
├── difficulty.ts                    # rolling-accuracy difficulty engine (pure functions)
└── prompts/**                       # one file per system prompt

supabase/migrations/0001_init.sql    # full schema + RLS policies + match_content_chunks()
types/db.ts                          # hand-written DB types — replace with `supabase gen types` output
```

## API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/ingest` | Extract text (paste or PDF) → chunk → embed → store |
| POST | `/api/courses/generate` | Build a course outline from a content source |
| POST | `/api/tutor/chat` | Streaming Socratic chat, RAG-grounded |
| POST | `/api/quiz/generate` | Generate quiz items at current difficulty |
| POST | `/api/quiz/grade` | Semantically grade a free-text answer |
| POST | `/api/srs/review` | Submit a review result, update SM-2 schedule |
| GET | `/api/srs/due` | Cards due today |
| GET | `/api/dashboard/mastery` | Per-concept mastery + streak + due count |
| POST | `/api/exam/predict-readiness` | Readiness score from recent attempts |
| POST | `/api/language/roleplay` | Streaming roleplay chat with inline correction |


