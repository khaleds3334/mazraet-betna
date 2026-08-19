import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Runs on every matched request: keeps the auth session alive and guards the
 * routes (see `updateSession`).
 *
 * **The file must live in `src/`, beside `app/`** — a `proxy.ts` at the repo
 * root, next to `src/`, is silently ignored by the dev server: no warning, no
 * compile line, every guarded route simply answers as if no guard existed.
 *
 * Named `proxy`, not `middleware`: Next 16 renamed the convention, and the old
 * name only prints a deprecation warning (T-39).
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Everything except Next internals and static assets.
  //
  // manifest.webmanifest is excluded on purpose: the browser fetches it without
  // credentials, so the session guard would see an anonymous request and answer
  // the manifest with a redirect to /login — and a manifest that doesn't load is
  // an app that can't be installed to the home screen.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
