import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamPractice } from "./ExamPractice";

export default async function ExamPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  return (
    <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{course.title}</h1>
        <p className="text-sm text-muted-foreground">
          {course.exam_date ? `Exam date: ${course.exam_date}` : "No exam date set"}
        </p>
      </div>
      <ExamPractice courseId={courseId} outline={course.outline} />
    </main>
  );
}
