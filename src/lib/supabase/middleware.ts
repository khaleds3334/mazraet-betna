import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/** Auth screens anyone can reach without a session. Everything else needs one. */
const PUBLIC_PATHS = ["/login", "/register", "/pin"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Keeps the Supabase auth session fresh on every request, and guards routes:
 * a visitor with no session is sent to /login; a signed-in user landing on an
 * auth screen is sent home. Called from the root middleware.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touching the user refreshes the session cookies. Do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // /logout is the escape hatch from a session the app can't place, so it must
  // never be redirected — not even the "signed in? go home" rule below.
  if (pathname === "/logout") return response;

  const publicPath = isPublic(pathname);

  // No session on a protected route → go log in.
  if (!user && !publicPath) {
    return redirectTo(request, response, "/login");
  }

  // The role lives in app_metadata (service-role-only, D-14). Customers own the
  // root; the admin app lives under /admin. Send each to their own home and keep
  // them out of the other's area.
  const role = user?.app_metadata?.role;

  // A signed-in account that is neither has no home to be sent to, and every
  // screen it reaches bounces it back to /login — which bounces it here again.
  // Ending the session is the only exit, so do it rather than loop.
  if (user && role !== "admin" && role !== "customer") {
    await supabase.auth.signOut({ scope: "local" });
    return redirectTo(request, response, "/login");
  }

  const homePath = role === "admin" ? "/admin" : "/";
  const inAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");

  // Already signed in but sitting on an auth screen → go to the right home.
  if (user && publicPath) {
    return redirectTo(request, response, homePath);
  }

  // Wrong app for the role → bounce to the right one.
  if (user && !publicPath) {
    if (role === "admin" && !inAdminArea) {
      return redirectTo(request, response, "/admin");
    }
    if (role !== "admin" && inAdminArea) {
      return redirectTo(request, response, "/");
    }
  }

  return response;
}

/**
 * Redirect while preserving any auth cookies refreshed on `response`.
 *
 * `request.nextUrl`, never `request.url`: `request.url` carries the address the
 * server was *bound* to — `http://0.0.0.0:3000` under `next dev` — and 0.0.0.0
 * means "every interface", not a destination a browser can open. From a proxy,
 * `NextResponse.redirect` of a same-origin URL is emitted as a relative
 * `Location` anyway, so this stays correct on the phone and behind Vercel's
 * proxy as well. A route handler does *not* get that treatment — see
 * `/lib/redirect.ts` (T-38).
 */
function redirectTo(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
