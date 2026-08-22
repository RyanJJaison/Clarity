import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoleplayPanel } from "./RoleplayPanel";

export default async function LanguagePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  return (
    <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-8 min-h-0">
      <h1 className="text-xl font-semibold mb-1">
        {course.target_language ?? "Language"} practice — {course.title}
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Roleplay a scenario. Mistakes get a short correction inline.
      </p>
      <RoleplayPanel courseId={courseId} />
    </main>
  );
}
