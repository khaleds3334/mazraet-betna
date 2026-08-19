import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";
import { redirectTo } from "@/lib/redirect";
import type { Database } from "@/types/database";

/**
 * The way out of a session the app can't place.
 *
 * A page that finds a session but no matching row (a customer whose record was
 * removed, an account belonging to neither app) cannot simply redirect to
 * /login: the proxy sees a live session there and sends it straight back, so the
 * two bounce forever and the user is locked out of their own browser with no
 * screen to tap. This route clears the session first, which turns that dead end
 * into a plain trip back to the login screen.
 *
 * A GET route rather than the `signOut` Server Action because a redirect from a
 * Server Component is a navigation, not a form submission.
 */
export async function GET(request: NextRequest) {
  // A relative Location — see redirectTo. In a route handler NextResponse.redirect
  // sends whatever absolute URL it is handed, and neither candidate is right:
  // `request.url` is the address the server was bound to (0.0.0.0, which no
  // browser can reach), and `request.nextUrl` is the dev server's own localhost,
  // which on the father's phone would mean the phone itself.
  const response = redirectTo("/login");

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
