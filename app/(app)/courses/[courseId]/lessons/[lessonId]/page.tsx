import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LessonQuiz } from "./LessonQuiz";
import type { CourseOutline, OutlineLesson } from "@/types/db";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course?.outline) notFound();

  const outline = course.outline as CourseOutline;
  const lesson: OutlineLesson | undefined = outline.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === lessonId);

  if (!lesson) notFound();

  return (
    <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full flex flex-col gap-6">
      <div>
        <Link href={`/courses/${courseId}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to {course.title}
        </Link>
        <h1 className="text-2xl font-semibold mt-2">{lesson.title}</h1>
        <div className="flex gap-1 mt-2">
          {lesson.conceptTags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Ask the tutor to explain this lesson, or jump straight to the quiz once you feel ready.
      </p>

      <Button asChild variant="outline" className="self-start">
        <Link href={`/tutor/${courseId}`}>Open tutor chat for this course</Link>
      </Button>

      <LessonQuiz courseId={courseId} lessonId={lessonId} conceptTag={lesson.conceptTags[0] ?? lesson.title} />
    </main>
  );
}
