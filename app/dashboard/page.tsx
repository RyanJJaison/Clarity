import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MasteryChart } from "@/components/MasteryChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mastery } = await supabase.from("mastery").select("concept_tag, mastery_score").eq("user_id", user!.id);

  const { count: dueCount } = await supabase
    .from("srs_cards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .lte("due_date", new Date().toISOString().slice(0, 10));

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, mode")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button asChild>
          <Link href="/courses/new">New course</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Due for review</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-3xl font-semibold">{dueCount ?? 0}</p>
            <Button variant="outline" asChild>
              <Link href="/review">Review now</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your courses</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {courses && courses.length > 0 ? (
              courses.map((c) => (
                <Link key={c.id} href={`/courses/${c.id}`} className="text-sm hover:underline">
                  {c.title} <span className="text-muted-foreground">({c.mode})</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No courses yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mastery by concept</CardTitle>
        </CardHeader>
        <CardContent>
          <MasteryChart mastery={mastery ?? []} />
        </CardContent>
      </Card>
    </main>
  );
}
