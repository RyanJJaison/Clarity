import { createBrowserClient } from "@supabase/ssr";

// Not parameterized with the Database type: types/db.ts is hand-written and
// doesn't match the shape @supabase/supabase-js needs for generic inference.
// Swap in `createBrowserClient<Database>(...)` once real types are generated
// via `supabase gen types typescript`.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
