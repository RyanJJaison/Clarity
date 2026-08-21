import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MODES = [
  {
    title: "General Tutor",
    description:
      "Upload any material and get a structured course with lessons, Socratic chat, and quizzes.",
  },
  {
    title: "Exam Prep",
    description:
      "Turn a syllabus or notes into adaptive practice tests with a live readiness score.",
  },
  {
    title: "Language Learning",
    description:
      "Roleplay conversations with inline corrections and vocabulary flashcards.",
  },
];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <span className="font-semibold text-lg">Clarity</span>
        <nav className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </nav>
      </header>

      <section className="max-w-3xl mx-auto text-center px-6 py-20">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          One AI engine for how you actually learn.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Ingest anything. Get a personalized tutor, adaptive quizzes, spaced-repetition
          review, and exam or language coaching — instead of three disconnected tools.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">I have an account</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto grid gap-6 px-6 pb-24 sm:grid-cols-3">
        {MODES.map((mode) => (
          <Card key={mode.title}>
            <CardHeader>
              <CardTitle>{mode.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {mode.description}
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
