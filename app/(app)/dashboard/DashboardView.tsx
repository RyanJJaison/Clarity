"use client";

import Link from "next/link";
import {
  Flame,
  BookOpen,
  Layers,
  MessageSquareIcon,
  PenSquareIcon,
  TimerIcon,
  ClipboardListIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MasteryChart, type MasteryRow } from "@/components/MasteryChart";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HoverCard } from "@/components/motion/HoverCard";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { CourseCard } from "@/components/cards/CourseCard";
import { RecommendationCard } from "@/components/cards/RecommendationCard";
import { ProgressCard } from "@/components/cards/ProgressCard";
import { AIToolCard } from "@/components/cards/AIToolCard";
import { ClassroomScene } from "@/components/classroom/ClassroomScene";
import { DashboardGreeting } from "@/components/ai-invigilator/DashboardGreeting";
import type { ActivityItem, Recommendation } from "@/lib/dashboard-data";

export interface CourseRow {
  id: string;
  title: string;
  mode: string;
}

interface DashboardViewProps {
  mastery: MasteryRow[];
  dueCount: number;
  streak: number;
  courses: CourseRow[];
  activity: ActivityItem[];
  recommendations: Recommendation[];
  courseProgress: Record<string, number>;
  focusCourse: CourseRow | null;
  quizAccuracy: number | null;
}

const STATS = (dueCount: number, streak: number, courseCount: number) => [
  {
    key: "due",
    label: "Due for review",
    value: dueCount,
    icon: Layers,
    href: "/review",
    cta: "Review now",
  },
  {
    key: "streak",
    label: "Day streak",
    value: streak,
    icon: Flame,
    suffix: streak === 1 ? " day" : " days",
  },
  {
    key: "courses",
    label: "Active courses",
    value: courseCount,
    icon: BookOpen,
  },
];

export function DashboardView({
  mastery,
  dueCount,
  streak,
  courses,
  activity,
  recommendations,
  courseProgress,
  focusCourse,
  quizAccuracy,
}: DashboardViewProps) {
  const stats = STATS(dueCount, streak, courses.length);

  const todaysFocus =
    dueCount > 0
      ? { title: `Review ${dueCount} due card${dueCount === 1 ? "" : "s"}`, href: "/review", cta: "Review now" }
      : focusCourse
        ? { title: `Continue ${focusCourse.title}`, href: `/courses/${focusCourse.id}`, cta: "Continue" }
        : { title: "Start your first course", href: "/courses/new", cta: "Get started" };

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full flex flex-col gap-10">
      <Reveal tier="background">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
          <Button asChild>
            <Link href="/courses/new">New course</Link>
          </Button>
        </div>
      </Reveal>

      <DashboardGreeting subject={focusCourse?.title} todaysFocusHref="#today-focus" />

      <ClassroomScene courses={courses} />

      {/* Today's Focus — the single most important next action, derived from real signals only. */}
      <Reveal id="today-focus" tier="content" className="scroll-mt-[calc(var(--nav-height)+1.5rem)]">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6">
            <div className="flex-1">
              <p className="text-xs font-medium text-subtle uppercase tracking-wide">Today&apos;s focus</p>
              <h2 className="font-heading text-xl font-semibold mt-1">{todaysFocus.title}</h2>
            </div>
            <Button size="lg" asChild>
              <Link href={todaysFocus.href}>{todaysFocus.cta}</Link>
            </Button>
          </CardContent>
        </Card>
      </Reveal>

      {/* Continue Learning */}
      {focusCourse && (
        <Reveal tier="content" delay={0.05}>
          <CourseCard
            id={focusCourse.id}
            title={focusCourse.title}
            mode={focusCourse.mode}
            progress={courseProgress[focusCourse.id] ?? null}
            variant="featured"
          />
        </Reveal>
      )}

      {/* Quick Actions */}
      <Reveal tier="primaryAction">
        <StaggerGroup className="grid gap-3 sm:grid-cols-2">
          <StaggerItem>
            <AIToolCard
              icon={MessageSquareIcon}
              title="Ask Clarity"
              description="Get a Socratic explanation on anything from your course."
              href={focusCourse ? `/tutor/${focusCourse.id}` : "/courses/new"}
            />
          </StaggerItem>
          <StaggerItem>
            <AIToolCard
              icon={PenSquareIcon}
              title="Create a quiz"
              description="Generate practice questions at your current level."
              href={focusCourse ? `/courses/${focusCourse.id}` : "/courses/new"}
            />
          </StaggerItem>
          <StaggerItem>
            <AIToolCard
              icon={TimerIcon}
              title="Start a focus session"
              description="A distraction-free timer for deep work."
              href="/focus"
            />
          </StaggerItem>
          <StaggerItem>
            <AIToolCard
              icon={ClipboardListIcon}
              title="Review due cards"
              description="Spaced-repetition review, across every course."
              href="/review"
            />
          </StaggerItem>
        </StaggerGroup>
      </Reveal>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <Reveal tier="primaryAction" delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Recommended for you</CardTitle>
            </CardHeader>
            <CardContent>
              <StaggerGroup className="flex flex-col gap-2">
                {recommendations.map((rec) => (
                  <StaggerItem key={rec.id}>
                    <RecommendationCard {...rec} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </CardContent>
          </Card>
        </Reveal>
      )}

      {/* Stats */}
      <StaggerGroup className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StaggerItem key={stat.key}>
            <HoverCard>
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className="size-4 text-primary" aria-hidden="true" />
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                  <p className="text-3xl font-heading font-semibold">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix ?? ""} />
                  </p>
                  {stat.href && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={stat.href}>{stat.cta}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
        ))}
      </StaggerGroup>

      {/* Your courses */}
      <Reveal id="subjects" delay={0.15} className="scroll-mt-[calc(var(--nav-height)+1.5rem)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Your courses</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
              <StaggerGroup className="flex flex-col gap-2">
                {courses.map((c) => (
                  <StaggerItem key={c.id}>
                    <CourseCard id={c.id} title={c.title} mode={c.mode} progress={courseProgress[c.id] ?? null} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <p className="text-sm text-muted-foreground">
                No courses yet.{" "}
                <Link href="/courses/new" className="underline">
                  Start one
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </Reveal>

      {/* Progress */}
      <Reveal id="mastery" delay={0.2} className="scroll-mt-[calc(var(--nav-height)+1.5rem)] flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressCard
            label="Quiz accuracy (30 days)"
            icon={PenSquareIcon}
            value={quizAccuracy}
            emptyLabel="Take a quiz to see your accuracy here."
          />
          <ProgressCard
            label="Consistency"
            icon={Flame}
            value={streak > 0 ? Math.min(100, Math.round((streak / 7) * 100)) : null}
            emptyLabel="Study today to start a streak."
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Mastery by concept</CardTitle>
          </CardHeader>
          <CardContent>
            <MasteryChart mastery={mastery} />
          </CardContent>
        </Card>
      </Reveal>

      {/* Recent Activity */}
      <Reveal delay={0.25}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length > 0 ? (
              <StaggerGroup className="flex flex-col gap-3">
                {activity.map((item) => (
                  <StaggerItem key={item.id} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-1.5 size-1.5 rounded-full shrink-0 ${item.type === "quiz" ? "bg-primary" : "bg-accent"}`}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-muted-foreground">{item.summary}</span>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <p className="text-sm text-muted-foreground">
                No activity yet — take a quiz or ask the tutor a question to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </Reveal>

      {/* Upcoming — honest: no assignments/deadlines feature exists yet */}
      <Reveal delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Assignments and deadlines aren&apos;t tracked yet.{" "}
              <Link href="/assignments" className="underline">
                Learn more
              </Link>
              . Review is scheduled automatically — see{" "}
              <Link href="/review" className="underline">
                what&apos;s due
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </Reveal>
    </main>
  );
}
