"use client";

import Link from "next/link";
import { Flame, BookOpen, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MasteryChart, type MasteryRow } from "@/components/MasteryChart";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { HoverCard } from "@/components/motion/HoverCard";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

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

export function DashboardView({ mastery, dueCount, streak, courses }: DashboardViewProps) {
  const stats = STATS(dueCount, streak, courses.length);

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full flex flex-col gap-8">
      <Reveal>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
          <Button asChild>
            <Link href="/courses/new">New course</Link>
          </Button>
        </div>
      </Reveal>

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

      <Reveal delay={0.15}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Your courses</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
              <StaggerGroup className="flex flex-col gap-2">
                {courses.map((c) => (
                  <StaggerItem key={c.id}>
                    <HoverCard>
                      <Link
                        href={`/courses/${c.id}`}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <span>{c.title}</span>
                        <span className="text-muted-foreground capitalize">{c.mode}</span>
                      </Link>
                    </HoverCard>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <p className="text-sm text-muted-foreground">No courses yet.</p>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Mastery by concept</CardTitle>
          </CardHeader>
          <CardContent>
            <MasteryChart mastery={mastery} />
          </CardContent>
        </Card>
      </Reveal>
    </main>
  );
}
