"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * How long the app has to have been away before coming back is worth a re-read.
 * Short enough that putting the phone down and picking it up counts; long enough
 * that glancing at a notification and coming straight back does not.
 */
const AWAY_MS = 20_000;

/**
 * Re-read the screen when the app comes back to the front (Khaled, 2026-08-22).
 *
 * The customer's home is server-rendered: whether the sale is open, and the date
 * it counts to, are read once when the page loads and then held. The clock on it
 * keeps ticking on its own — that part is client-side — but the admin opening
 * the sale, closing it, or moving «فترة البيع تبدء في» does not reach a copy of
 * the page that is already sitting on someone's phone. Until it is closed and
 * opened again, the customer is looking at what the farm was doing when he last
 * opened it.
 *
 * These customers are often elderly and rarely close anything: an app left on
 * the home screen and returned to tomorrow is the normal case, not the edge
 * one. So returning is what triggers the re-read — `router.refresh()` re-runs
 * the server components and leaves everything the client is holding alone, so
 * nothing typed or opened is lost.
 *
 * **Not a poll, deliberately.** Nothing here runs on a timer and nothing holds a
 * connection open. The one case this does not cover is a phone left awake on
 * this exact screen while the admin flips the sale — for which the cost would be
 * a socket open on every customer's phone all day, and the customer would find
 * out the moment he tried to order anyway.
 */
export function RefreshOnReturn() {
  const router = useRouter();

  useEffect(() => {
    let awaySince: number | null = null;

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        awaySince = Date.now();
        return;
      }
      if (awaySince !== null && Date.now() - awaySince >= AWAY_MS) {
        router.refresh();
      }
      awaySince = null;
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, [router]);

  return null;
}
