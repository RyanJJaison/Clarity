# Clarity — AI Adaptive Learning Companion

Ingest anything — a PDF, pasted notes, an article — and get a personalized tutor,
adaptive quizzes, spaced-repetition review, exam or language coaching, focus sessions,
and an interactive classroom dashboard, all from one engine instead of several
disconnected tools.

## Status

A premium AI learning product built on a Supabase-backed Next.js app: real AI tutoring,
adaptive quizzes, spaced repetition, exam readiness scoring, language roleplay, a
data-driven dashboard, an interactive 2D classroom, an AI Invigilator companion, and
Focus Mode — all wired to real data, no fabricated content. Three features
(Assignments, Schedule, Achievements) are honest placeholders with no backing data
model yet; see `components/ComingSoon.tsx`.

## Tech stack

- Next.js 16 (App Router) + TypeScript, single repo/deploy
- Tailwind CSS + shadcn/ui (Radix) — full design system with light/dark themes, see `/design-system`
- `motion` (motion.dev) for the entire motion system — no second animation library
- Supabase (Postgres + Auth + `pgvector`)
- Anthropic Claude (`claude-sonnet-5` for generation/chat, `claude-haiku-4-5` for grading/extraction/the AI Invigilator)
- Voyage AI for embeddings
- Vitest for unit tests

## Architecture

```
Browser ── Next.js App Router ──┬── app/api/**  (route handlers: ingest, chat, quiz, srs, dashboard, focus)
                                 ├── lib/**      (Anthropic + Voyage wrappers, RAG, SRS, difficulty, dashboard data)
                                 └── Supabase (Postgres + pgvector + Auth), via lib/supabase/{client,server}.ts
```

- `lib/srs.ts`, `lib/difficulty.ts`, `lib/streak.ts`, and `lib/dashboard-data.ts` are pure
  functions — unit tested in `tests/`. Every dashboard section (Today's Focus, Continue
  Learning, Recommendations, Recent Activity) is derived from real rows in these — nothing
  is fabricated.
- `lib/anthropic.ts` and `lib/embeddings.ts` transparently fall back to clearly-labeled
  mock responses when `ANTHROPIC_API_KEY` / `VOYAGE_API_KEY` are unset, so the app runs
  end-to-end without real keys. Supabase itself (auth + database) has no mock — you need
  a real (free-tier) Supabase project for anything past the landing page.
- `lib/motion/` centralizes every animation token (duration/ease/spring/parallax-depth)
  and variant (fade/slide/scale/stagger/page/modal) — see `components/motion/`.
- `lib/design-system/` mirrors the CSS-first design tokens in `app/globals.css` for the
  pieces JS needs (z-index, breakpoints, class-name lookups).

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
   Open [http://localhost:3000](http://localhost:3000). The landing page and `/about` work
   with no Supabase project configured; everything else needs one (see step 2). Sign up,
   pick a mode, paste some text, and the outline/chat/quiz flow works immediately — using
   mock AI responses until you add real `ANTHROPIC_API_KEY` / `VOYAGE_API_KEY` values.

5. **Run tests / lint / typecheck**
   ```bash
   npm test
   npm run lint
   npx tsc --noEmit
   ```

## Repo structure

```
app/
├── (auth)/login, (auth)/signup       # Supabase email/password auth (no shell)
├── onboarding                        # pick mode + starting level (no shell)
├── page.tsx                          # public landing page
├── about/                            # public About page
├── design-system/                    # living style-guide / token reference
├── (app)/                            # route group — every authenticated page below
│   │                                 # gets the shared AppShell (navbar/mobile-nav/
│   │                                 # command palette). Group folders don't affect
│   │                                 # URLs: (app)/dashboard still serves /dashboard.
│   ├── layout.tsx                    # fetches user + courses once, mounts AppShell
│   ├── dashboard/                    # Today's Focus, Continue Learning, classroom,
│   │                                 # recommendations, progress, recent activity
│   ├── courses/new, courses/[id]     # ingest content → generate outline; lessons + quiz
│   ├── tutor/[courseId]              # AI Learning Workspace (context panel + modes)
│   ├── exam/[courseId]               # practice tests + readiness score
│   ├── language/[courseId]           # roleplay chat + vocab SRS
│   ├── review                        # SRS due-cards queue (all modes)
│   ├── focus                         # Focus Mode: timer + AI Invigilator check-ins
│   ├── assignments, schedule,
│   │   achievements                  # honest "not built yet" placeholders
└── api/**                            # route handlers, see below

components/
├── navigation/                       # AppNavbar, MobileBottomNav, CommandPalette,
│                                     # AppShell, nav-config.ts (single source of truth)
├── classroom/                        # ClassroomScene/Background/Lighting/Object/
│                                     # Navigation + hand-authored SVG artwork
├── ai-invigilator/                   # the mascot, speech bubble, dashboard greeting
├── cards/                            # CourseCard, RecommendationCard, ProgressCard, AIToolCard
├── motion/                           # Reveal, Parallax, HoverCard, PressScale, etc.
└── ui/                               # shadcn primitives + Glass* components

lib/
├── supabase/{client,server}.ts       # browser / server / admin Supabase clients
├── anthropic.ts                      # Claude wrapper (streaming + non-streaming, mock fallback)
├── embeddings.ts                     # Voyage AI wrapper (mock fallback)
├── rag.ts                            # chunking + context formatting
├── srs.ts, difficulty.ts, streak.ts  # pure functions, unit tested
├── dashboard-data.ts                 # recommendations/activity/progress, all real-data-derived
├── motion/                           # tokens.ts + variants.ts — the central motion config
├── design-system/                    # tokens.ts — JS mirror of the CSS design tokens
└── prompts/**                        # one file per system prompt, incl. invigilator.ts

supabase/migrations/0001_init.sql     # full schema + RLS policies + match_content_chunks()
types/db.ts                           # hand-written DB types — replace with `supabase gen types` output
```

## API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/ingest` | Extract text (paste or PDF) → chunk → embed → store |
| POST | `/api/courses/generate` | Build a course outline from a content source |
| POST | `/api/tutor/chat` | Streaming Socratic chat, RAG-grounded, mode-aware (Explain/Practice/Review/Exam Prep/Homework Help) |
| POST | `/api/quiz/generate` | Generate quiz items at current difficulty |
| POST | `/api/quiz/grade` | Semantically grade a free-text answer |
| POST | `/api/srs/review` | Submit a review result, update SM-2 schedule |
| GET | `/api/srs/due` | Cards due today |
| GET | `/api/dashboard/mastery` | Per-concept mastery + streak + due count |
| POST | `/api/exam/predict-readiness` | Readiness score from recent attempts |
| POST | `/api/language/roleplay` | Streaming roleplay chat with inline correction |
| POST | `/api/focus/encourage` | AI Invigilator greeting/reflection for a focus session, grounded in real due-card counts |
