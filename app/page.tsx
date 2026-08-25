import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { AppNavbar } from "@/components/navigation/AppNavbar";
import { ClassroomHeroScene } from "@/components/classroom-hero/ClassroomHeroScene";
import type { CourseSummary } from "@/components/navigation/nav-config";

// Illustrative-only: a signed-out visitor has no real courses or progress yet,
// so the hero shows a representative demo scene (matching the Figma mockup's
// own sample numbers) rather than the "start your first course" empty state.
const SAMPLE_COURSES: CourseSummary[] = [
  { id: "sample-history", title: "Modern European History", mode: "history" },
  { id: "sample-chem", title: "Organic Chemistry", mode: "chemistry" },
  { id: "sample-spanish", title: "Spanish B2", mode: "language" },
  { id: "sample-law", title: "Contract Law", mode: "law" },
  { id: "sample-bio", title: "Cell Biology", mode: "biology" },
  { id: "sample-econ", title: "Macroeconomics", mode: "economics" },
];
const SAMPLE_FOCUS_COURSE = SAMPLE_COURSES[0];
const SAMPLE_FOCUS_PROGRESS = 0.65;

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <AppNavbar variant="public" />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[32rem] w-[64rem] rounded-full bg-gradient-to-br from-primary/25 via-accent/15 to-transparent blur-3xl"
        />

        <section className="relative max-w-2xl mx-auto text-center px-6 pt-16 pb-8">
          <Reveal>
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              Learning should feel clearer.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              An AI learning environment that adapts to how you actually learn.
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

        <Reveal delay={0.25} className="relative max-w-6xl mx-auto w-full px-6 pb-24">
          <ClassroomHeroScene
            email="alex@example.com"
            courses={SAMPLE_COURSES}
            todaysFocus={{ title: `Continue ${SAMPLE_FOCUS_COURSE.title}`, detail: "65% mastery", href: "/signup" }}
            continueLearning={{ title: SAMPLE_FOCUS_COURSE.title, detail: "65% mastery", href: "/signup" }}
            focusCourse={SAMPLE_FOCUS_COURSE}
            focusCourseProgress={SAMPLE_FOCUS_PROGRESS}
            streak={12}
            dueCount={4}
          />
        </Reveal>
      </main>
    </div>
  );
}
