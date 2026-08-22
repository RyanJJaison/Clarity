import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/navigation/AppShell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defensive: proxy.ts already gates every route under this layout, so
  // this should never actually run, but a layout shared by this many pages
  // shouldn't assume it.
  if (!user) {
    redirect("/login");
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, mode")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell user={{ email: user.email ?? "" }} courses={courses ?? []}>
      {children}
    </AppShell>
  );
}
