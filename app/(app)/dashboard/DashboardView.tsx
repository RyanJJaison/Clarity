"use client";

import Link from "next/link";
import { Flame, BookOpen, Layers, MessageSquareIcon, PenSquareIcon, TimerIcon, ClipboardListIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MasteryChart, type MasteryRow } from "@/components/MasteryChart";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { CourseCard } from "@/components/cards/CourseCard";
import { RecommendationCard } from "@/components/cards/RecommendationCard";
import { AIToolCard } from "@/components/cards/AIToolCard";
import { ClassroomHeroScene } from "@/components/classroom-hero/ClassroomHeroScene";
import type { ActivityItem, ObjectiveSummary, Recommendation } from "@/lib/dashboard-data";

export interface CourseRow {
  id: string;
  title: string;
  mode: string;
}

interface DashboardViewProps {
  email: string;
  mastery: MasteryRow[];
  dueCount: number;
  streak: number;
  courses: CourseRow[];
  activity: ActivityItem[];
  recommendations: Recommendation[];
  courseProgress: Record<string, number>;
  focusCourse: CourseRow | null;
  quizAccuracy: number | null;
  todaysFocus: ObjectiveSummary;
  continueLearning: ObjectiveSummary | null;
}

const AT_A_GLANCE = (dueCount: number, streak: number, courseCount: number) => [
  { key: "due", label: "Due", value: dueCount, icon: Layers },
  { key: "streak", label: "day streak", value: streak, icon: Flame },
  { key: "courses", label: "courses", value: courseCount, icon: BookOpen },
];

export function DashboardView({
  email,
  mastery,
  dueCount,
  streak,
  courses,
  activity,
  recommendations,
  courseProgress,
  focusCourse,
  quizAccuracy,
  todaysFocus,
  continueLearning,
}: DashboardViewProps) {
  const stats = AT_A_GLANCE(dueCount, streak, courses.length);

  return (
    <main className="flex-1 w-full flex flex-col gap-10 pb-16">
      {/* The classroom IS the dashboard — full-width, dominant, first thing seen. */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Reveal tier="background">
          <ClassroomHeroScene
            email={email}
            courses={courses}
            todaysFocus={todaysFocus}
            continueLearning={continueLearning}
            focusCourse={focusCourse}
            focusCourseProgress={focusCourse ? (courseProgress[focusCourse.id] ?? null) : null}
            streak={streak}
            dueCount={dueCount}
          />
        </Reveal>
      </div>

      {/* Everything below is secondary reference material, not a second hero. */}
      <div className="w-full max-w-3xl mx-auto px-6 flex flex-col gap-10">
        {/* At a glance — one compact strip, not three competing cards */}
        <Reveal tier="content">
          <Card>
            <CardContent className="flex items-center divide-x divide-border pt-6">
              {stats.map((stat) => (
                <div key={stat.key} className="flex-1 flex items-center gap-2 px-3 first:pl-0 last:pr-0">
                  <stat.icon className="size-4 text-primary shrink-0" aria-hidden="true" />
                  <p className="text-lg font-heading font-semibold">
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/review">Review</Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>

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
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Mastery by concept</CardTitle>
            </CardHeader>
            <CardContent>
              <MasteryChart mastery={mastery} />
              {quizAccuracy !== null && (
                <p className="text-xs text-muted-foreground mt-4">
                  {quizAccuracy}% quiz accuracy over the last 30 days.
                </p>
              )}
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
      </div>
    </main>
  );
}
