import { NextResponse } from "next/server";

/**
 * A redirect carrying a **relative** `Location`, e.g. `/login`. For **route
 * handlers** — the proxy has its own path, see `redirectTo` in
 * `/lib/supabase/middleware.ts`.
 *
 * `NextResponse.redirect()` needs an absolute URL and sends exactly what it is
 * given, and from a route handler neither candidate origin is right:
 *
 *   • `request.url` is the address the server was **bound** to. `next dev` binds
 *     to `0.0.0.0` by default, so this produced `http://0.0.0.0:3000/login` —
 *     0.0.0.0 means "every interface", not a destination, and the browser
 *     answered with "can't reach this site" on a server that was working.
 *   • `request.nextUrl` is the dev server's own canonical origin
 *     (`http://localhost:3000`) and does **not** follow the request's `Host`
 *     header — measured, not assumed. On the father's phone over the Wi-Fi that
 *     would send the phone to *its own* localhost.
 *
 * The path is the only part the server genuinely knows. A relative `Location` is
 * resolved by the browser against the address it is already on, so it is right
 * from the laptop, from the phone, and from behind Vercel's proxy alike.
 */
export function redirectTo(pathname: string): NextResponse {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: pathname },
  });
}
