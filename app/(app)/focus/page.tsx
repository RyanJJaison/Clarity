import { createClient } from "@/lib/supabase/server";
import { FocusSession } from "./FocusSession";

export default async function FocusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, mode")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 px-6 py-12">
      <FocusSession courses={courses ?? []} />
    </main>
  );
}
