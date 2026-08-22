import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { HoverCard } from "@/components/motion/HoverCard";
import { AppNavbar } from "@/components/navigation/AppNavbar";

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
    <div className="flex-1 flex flex-col">
      <AppNavbar variant="public" />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[32rem] w-[64rem] rounded-full bg-gradient-to-br from-primary/25 via-accent/15 to-transparent blur-3xl"
        />

        <section className="relative max-w-3xl mx-auto text-center px-6 py-20">
          <Reveal>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              One AI engine for how you actually learn.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              Ingest anything. Get a personalized tutor, adaptive quizzes, spaced-repetition
              review, and exam or language coaching — instead of three disconnected tools.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">I have an account</Link>
              </Button>
            </div>
          </Reveal>
        </section>

        <StaggerGroup className="relative max-w-5xl mx-auto grid gap-6 px-6 pb-24 sm:grid-cols-3">
          {MODES.map((mode) => (
            <StaggerItem key={mode.title}>
              <HoverCard>
                <Card className="h-full border-border/60 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-heading">{mode.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{mode.description}</CardContent>
                </Card>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </main>
    </div>
  );
}
