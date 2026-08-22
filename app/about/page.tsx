import type { Metadata } from "next";
import {
  MessageSquareIcon,
  PenSquareIcon,
  LayersIcon,
  TargetIcon,
  LanguagesIcon,
  TrendingUpIcon,
  SparklesIcon,
  TimerIcon,
  SchoolIcon,
} from "lucide-react";
import { AppNavbar } from "@/components/navigation/AppNavbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Display, H2, H3, Body, LabelText } from "@/components/ui/typography";
import { Reveal, ScrollReveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { AIInvigilator } from "@/components/ai-invigilator/AIInvigilator";

export const metadata: Metadata = {
  title: "About Clarity",
  description: "What Clarity is, why it exists, and who built it.",
};

// Only capabilities actually implemented in the app — verified against the
// repository, not aspirational. See the Section 19 audit in project history
// for what's still a placeholder (assignments, schedule, achievements).
const CAPABILITIES = [
  {
    icon: MessageSquareIcon,
    title: "AI Socratic Tutor",
    description: "A RAG-grounded chat that guides you toward an answer instead of just handing it over.",
  },
  {
    icon: PenSquareIcon,
    title: "Adaptive Quizzes",
    description: "Generated at your current level and graded by meaning, not exact wording.",
  },
  {
    icon: LayersIcon,
    title: "Spaced-Repetition Review",
    description: "An SM-2 scheduler keeps due cards surfaced across every course automatically.",
  },
  {
    icon: TargetIcon,
    title: "Exam Readiness Scoring",
    description: "A live estimate of how ready you are, based on your actual recent practice.",
  },
  {
    icon: LanguagesIcon,
    title: "Language Roleplay",
    description: "Conversation practice with inline grammar corrections in your target language.",
  },
  {
    icon: TrendingUpIcon,
    title: "Progress & Mastery Analytics",
    description: "Per-concept mastery, streaks, and quiz accuracy, all derived from real activity.",
  },
  {
    icon: SparklesIcon,
    title: "Personalized Recommendations",
    description: "Suggestions grounded in your weakest concepts and recent activity — never invented.",
  },
  {
    icon: TimerIcon,
    title: "Focus Sessions",
    description: "A distraction-free timer with a real AI check-in at the start and end.",
  },
  {
    icon: SchoolIcon,
    title: "The Interactive Classroom",
    description: "An illustrated, navigable dashboard where furniture doubles as real navigation.",
  },
];

const AUDIENCES = [
  { title: "School students", description: "Turning coursework into a personalized study plan." },
  { title: "College & university students", description: "Working through dense material at your own pace." },
  { title: "Independent learners", description: "Studying something new without a classroom around it." },
  { title: "Exam candidates", description: "Practicing with a readiness score that reflects real performance." },
];

const CONTRIBUTORS = [{ name: "Ryan Sudheer" }, { name: "J Hubert Alan" }];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function AboutPage() {
  return (
    <div className="flex-1 flex flex-col">
      <AppNavbar variant="public" />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[56rem] rounded-full bg-gradient-to-br from-primary/25 via-accent/15 to-transparent blur-3xl"
          />
          <div className="relative max-w-3xl mx-auto text-center px-6 py-24 flex flex-col items-center gap-6">
            <Reveal variant="scaleIn">
              <AIInvigilator state="greeting" size={72} />
            </Reveal>
            <Reveal delay={0.05}>
              <LabelText>About Clarity</LabelText>
            </Reveal>
            <Reveal delay={0.1}>
              <Display>Learning should feel clearer.</Display>
            </Reveal>
            <Reveal delay={0.15}>
              <Body className="text-muted-foreground max-w-xl">
                Clarity is an AI-powered educational platform that brings AI assistance, personalized
                learning, study tools, and progress tracking into one intelligent, navigable learning
                environment.
              </Body>
            </Reveal>
          </div>
        </section>

        {/* Why Clarity */}
        <ScrollReveal>
          <section className="max-w-3xl mx-auto px-6 py-16">
            <H2>Why Clarity?</H2>
            <Body className="mt-4 text-muted-foreground">
              Students today have access to more educational material than ever — but access isn&apos;t the
              same as understanding. It&apos;s easy to get stuck on a difficult concept, lose track of what
              to study next, or study inconsistently with no sense of whether it&apos;s working. And a human
              tutor isn&apos;t always available exactly when you need one.
            </Body>
            <Body className="mt-4 text-muted-foreground">
              Clarity brings those needs together — an AI tutor, adaptive practice, spaced repetition, and
              honest progress tracking — into one place, instead of three or four disconnected apps.
            </Body>
          </section>
        </ScrollReveal>

        {/* What We've Built */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <ScrollReveal>
            <H2 className="mb-2">What we&apos;ve built</H2>
            <Body className="text-muted-foreground mb-8">Every capability below is live in the app today.</Body>
          </ScrollReveal>
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((cap) => (
              <StaggerItem key={cap.title}>
                <GlassCard className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                      <cap.icon className="size-4" aria-hidden="true" />
                    </div>
                    <H3 className="text-base">{cap.title}</H3>
                    <p className="text-sm text-muted-foreground mt-1">{cap.description}</p>
                  </CardContent>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* Who It's For */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <ScrollReveal>
            <H2 className="mb-8">Who Clarity is for</H2>
          </ScrollReveal>
          <StaggerGroup className="grid gap-4 sm:grid-cols-2">
            {AUDIENCES.map((a) => (
              <StaggerItem key={a.title}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* Contributors */}
        <section className="max-w-3xl mx-auto px-6 py-16">
          <ScrollReveal>
            <H2 className="mb-2">The team behind Clarity</H2>
            <Body className="text-muted-foreground mb-8">
              Built with a shared goal: making learning clearer, more personalized, and more accessible
              through AI.
            </Body>
          </ScrollReveal>
          <StaggerGroup className="grid gap-4 sm:grid-cols-2">
            {CONTRIBUTORS.map((c) => (
              <StaggerItem key={c.name}>
                <GlassCard>
                  <CardContent className="flex items-center gap-4 pt-6">
                    <Avatar className="size-12">
                      <AvatarFallback className="text-sm font-medium">{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground">Co-creator</p>
                    </div>
                  </CardContent>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* Our Vision */}
        <ScrollReveal>
          <section className="max-w-3xl mx-auto px-6 py-16 pb-24">
            <H2>Our vision</H2>
            <Body className="mt-4 text-muted-foreground">
              We want AI-assisted learning to be more accessible, more personalized, and easier to
              understand — not a generic chatbot bolted onto a course, but a companion that actually knows
              what you&apos;re studying, where you&apos;re struggling, and what to do next. Clarity is an early
              step toward that: an engine that ties tutoring, practice, review, and progress together in
              one place, so studying feels less like guesswork.
            </Body>
          </section>
        </ScrollReveal>
      </main>
    </div>
  );
}
