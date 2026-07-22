import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components and Server Actions.
 * Reads/writes the auth session through cookies. RLS applies (the caller is the
 * logged-in admin or customer). Create a fresh one per request — never cache it.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Writing cookies from a Server Component throws; middleware refreshes
          // the session, so ignoring it here is safe.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* called from a Server Component — ignore */
          }
        },
      },
    },
  );
}

/**
 * Service-role client — BYPASSES RLS. Server-only. Use only for operations that
 * must sidestep row security: verifying the admin PIN in `admin_credentials`
 * (no RLS policy, T-14), linking a customer's auth account, system notifications.
 * The secret key must never reach the browser.
 */
export function createAdminClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
