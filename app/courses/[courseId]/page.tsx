import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseOutline } from "@/components/CourseOutline";
import { Button } from "@/components/ui/button";

const MODE_ROUTES: Record<string, string> = {
  general: "tutor",
  exam: "exam",
  language: "language",
};

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  const modeRoute = MODE_ROUTES[course.mode] ?? "tutor";

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          <p className="text-sm text-muted-foreground capitalize">{course.mode} mode</p>
        </div>
        <Button asChild>
          <Link href={`/${modeRoute}/${courseId}`}>Open {course.mode === "general" ? "tutor chat" : course.mode}</Link>
        </Button>
      </div>

      {course.outline ? (
        <CourseOutline courseId={courseId} outline={course.outline} />
      ) : (
        <p className="text-muted-foreground">No outline generated yet.</p>
      )}
    </main>
  );
}
