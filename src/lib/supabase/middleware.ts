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
  const publicPath = isPublic(pathname);

  // No session on a protected route → go log in.
  if (!user && !publicPath) {
    return redirectTo(request, response, "/login");
  }

  // The role lives in app_metadata (service-role-only, D-14). Customers own the
  // root; the admin app lives under /admin. Send each to their own home and keep
  // them out of the other's area.
  const role = user?.app_metadata?.role;
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

/** Redirect while preserving any auth cookies refreshed on `response`. */
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
