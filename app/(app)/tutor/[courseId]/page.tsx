import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatPanel } from "@/components/ChatPanel";

export default async function TutorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  return (
    <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-8 min-h-0">
      <h1 className="text-xl font-semibold mb-1">Tutor chat — {course.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Ask questions about the material. The tutor will guide you with questions before giving answers.
      </p>
      <div className="flex-1 min-h-0 border rounded-lg">
        <ChatPanel
          endpoint="/api/tutor/chat"
          body={{ courseId }}
          placeholder="Ask about a concept from this course to start the conversation."
        />
      </div>
    </main>
  );
}
