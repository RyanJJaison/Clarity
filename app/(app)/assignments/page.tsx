import Link from "next/link";
import { ClipboardListIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buildUpcomingDeadlines, courseProgress } from "@/lib/dashboard-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { DeadlineCard } from "@/components/cards/DeadlineCard";

export default async function AssignmentsPage() {
  const now = new Date();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, exam_date")
    .eq("user_id", user!.id)
    .not("exam_date", "is", null)
    .order("exam_date", { ascending: true });

  const { data: mastery } = await supabase
    .from("mastery")
    .select("course_id, concept_tag, dimension, mastery_score")
    .eq("user_id", user!.id);

  const progress = courseProgress(mastery ?? []);
  const deadlines = buildUpcomingDeadlines(courses ?? [], progress, now);

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6">
      <Reveal>
        <div>
          <h1 className="font-heading text-2xl font-semibold">Assignments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exam and deadline dates you&apos;ve set on your courses, soonest first — with your real mastery on each.
          </p>
        </div>
      </Reveal>

      {deadlines.length > 0 ? (
        <StaggerGroup className="flex flex-col gap-3">
          {deadlines.map((deadline) => (
            <StaggerItem key={deadline.courseId}>
              <DeadlineCard deadline={deadline} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <Reveal delay={0.1}>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ClipboardListIcon className="size-6" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-lg font-semibold">No upcoming deadlines</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Set an exam or deadline date next time you start a course, and it&apos;ll show up here.
              </p>
              <Button variant="outline" asChild>
                <Link href="/courses/new">Start a course</Link>
              </Button>
            </CardContent>
          </Card>
        </Reveal>
      )}
    </main>
  );
}
