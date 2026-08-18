import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/**
 * The way out of a session the app can't place.
 *
 * A page that finds a session but no matching row (a customer whose record was
 * removed, an account belonging to neither app) cannot simply redirect to
 * /login: the middleware sees a live session there and sends it straight back,
 * so the two bounce forever and the user is locked out of their own browser
 * with no screen to tap. This route clears the session first, which turns that
 * dead end into a plain trip back to the login screen.
 *
 * A GET route rather than the `signOut` Server Action because a redirect from a
 * Server Component is a navigation, not a form submission.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.signOut({ scope: "local" });

  return response;
}
