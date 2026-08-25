"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasOpenOverlay, subscribeOverlays } from "@/lib/overlayStack";

/**
 * Several rows usually change together — an order, its lines, and the notice
 * that goes with it — and they must cost one re-read, not three.
 */
const SETTLE_MS = 400;

/**
 * Keeps a screen honest while it is being looked at.
 *
 * **The problem it solves.** Every screen in this app is rendered on the server
 * and then held. The countdown ticks on its own, but whether the sale is open,
 * what the kilo costs, what stage an order has reached, and how many orders are
 * waiting are all read once and frozen. `RefreshOnReturn` covers the phone put
 * down and picked up; nothing covered the phone held. The admin opened the sale
 * and a customer looking straight at the screen saw nothing; a customer placed an
 * order and the admin standing at the scale saw nothing (Khaled, 2026-08-26).
 *
 * **It carries no data.** The subscription's payload is thrown away — the only
 * thing taken from it is *that* something changed, which turns into
 * `router.refresh()`. So every figure on every screen is still computed on the
 * server, by the same query, behind the same RLS, and nothing about how a screen
 * is built moves to the browser. That is the whole reason this is safe to add to
 * a finished app.
 *
 * **No filters, on purpose.** RLS is the filter, and it is a better one than
 * anything passed from a browser: `orders_select` already limits a customer to
 * his own orders and `notification_select` to his own notices, and Realtime
 * applies those policies per subscriber. So no ids need to reach the client and
 * there is no filter to get wrong.
 *
 * **Three things hold a refresh back:**
 * 1. **A settling window**, so a burst of related writes costs one re-read.
 * 2. **A hidden tab** — a phone in a pocket must not re-render all afternoon.
 *    The change is remembered and read when the app comes back.
 * 3. **An open overlay.** A re-read under the weighing sheet is the one thing
 *    here that must never surprise anyone — that screen is the whole project
 *    (CLAUDE.md). `router.refresh()` keeps client state, so nothing typed would
 *    be lost either way, but the numbers underneath a sheet being worked in must
 *    not move. It waits for the sheet to close and reads then.
 *
 * **Why not a poll.** `RefreshOnReturn`'s note weighed a socket per phone
 * against a timer and chose neither. A timer is the more expensive of the two on
 * a farm this size: it re-renders on a schedule whether or not anything happened,
 * and every one of those is a server render and a database read. This wakes only
 * when a row actually changed, which on this farm is a handful of times a day.
 */
export function LiveRefresh({ tables }: { tables: readonly string[] }) {
  const router = useRouter();
  // The list is written inline at both call sites, so a new array arrives on
  // every render; joining it gives the effect something stable to depend on.
  const key = tables.join(",");

  useEffect(() => {
    const watched = key.split(",");
    const supabase = createClient();

    let pending = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function flush() {
      if (stopped || !pending) return;
      // Both are re-checked here rather than when the event arrived: the tab may
      // have been hidden since, or a sheet opened. Whichever it is, `pending`
      // stays true and the listeners below come back to this.
      if (document.visibilityState !== "visible" || hasOpenOverlay()) return;
      pending = false;
      router.refresh();
    }

    function onChange() {
      pending = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, SETTLE_MS);
    }

    const channel = supabase.channel("live-refresh");
    for (const table of watched) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        onChange,
      );
    }
    channel.subscribe();

    // The two things that can un-block a held refresh.
    document.addEventListener("visibilitychange", flush);
    const unsubscribeOverlays = subscribeOverlays(flush);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", flush);
      unsubscribeOverlays();
      supabase.removeChannel(channel);
    };
  }, [key, router]);

  return null;
}
