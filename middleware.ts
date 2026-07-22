import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Runs on every matched request to keep the auth session alive. */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
