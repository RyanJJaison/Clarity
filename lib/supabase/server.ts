import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Not parameterized with the Database type: types/db.ts is hand-written and
// doesn't match the shape @supabase/supabase-js needs for generic inference.
// Swap in `createServerClient<Database>(...)` once real types are generated
// via `supabase gen types typescript`.

// Request-scoped client that respects the signed-in user's session and RLS.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no request context to write to.
            // Safe to ignore when middleware is refreshing the session.
          }
        },
      },
    }
  );
}

// Service-role client for trusted server-only operations that must bypass RLS
// (e.g. writing embeddings during ingestion). Never import this from client code.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
