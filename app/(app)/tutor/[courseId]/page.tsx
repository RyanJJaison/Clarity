import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TutorWorkspace } from "./TutorWorkspace";

export default async function TutorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  let sourceTitle: string | null = null;
  if (course.source_id) {
    const { data: source } = await supabase.from("content_sources").select("title").eq("id", course.source_id).single();
    sourceTitle = source?.title ?? null;
  }

  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-8 min-h-0">
      <h1 className="text-xl font-semibold mb-1">AI Learning Workspace</h1>
      <p className="text-sm text-muted-foreground mb-4">
        A Socratic tutor grounded in your course material — pick a learning mode and ask anything.
      </p>
      <TutorWorkspace
        courseId={courseId}
        courseTitle={course.title}
        level={course.proficiency_level ?? "intermediate"}
        hasMaterial={!!course.source_id}
        sourceTitle={sourceTitle}
      />
    </main>
  );
}
