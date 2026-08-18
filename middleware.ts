import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Runs on every matched request to keep the auth session alive. */
export async function middleware(request: NextRequest) {
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
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
