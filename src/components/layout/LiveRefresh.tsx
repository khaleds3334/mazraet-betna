"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
 * and then held. The countdown ticks by itself, but whether the sale is open,
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
 * **No filters, on purpose.** RLS is the filter, and a better one than anything
 * passed from a browser: `orders_select` already limits a customer to his own
 * orders and `notification_select` to his own notices, and Realtime applies
 * those policies per subscriber. So no ids need to reach the client and there is
 * no filter to get wrong.
 *
 * ## The socket has to be signed in — and it is not, by default
 *
 * **This is the whole reason it worked on a dev server and not on Vercel**
 * (Khaled, 2026-08-26). RLS is what decides which rows a subscriber is told
 * about, and RLS asks *who is this*. A socket that opens before the client has
 * finished reading the session out of the cookies is the `anon` role, and `anon`
 * matches no policy on any of these four tables — so it subscribes happily,
 * reports `SUBSCRIBED`, and is simply never sent anything. It fails silently,
 * which is why it looked like nothing at all was happening.
 *
 * It worked in development for a reason that has nothing to do with Realtime:
 * React's Strict Mode mounts every effect, tears it down and mounts it again. The
 * second mount happened after the session had loaded, so the second socket was
 * signed in. Production mounts once, and that once was too early.
 *
 * So the session is fetched first and handed to the socket **before** anything
 * subscribes — and handed over again whenever the token is renewed. That second
 * part matters here more than in most apps: the admin leaves this open on the
 * counter all day, and an access token expires in an hour. Without it the screen
 * would go live, work beautifully, and quietly stop around lunchtime.
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
    let channel: RealtimeChannel | null = null;

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

    async function start() {
      // Read the session BEFORE opening the socket — see the note above. Without
      // this the socket is `anon`, RLS tells it nothing, and it says SUBSCRIBED
      // while never delivering a single event.
      const { data } = await supabase.auth.getSession();
      if (stopped) return;

      const token = data.session?.access_token;
      // Nobody signed in: both shells sit behind the proxy's auth check, so this
      // is a session that expired between render and mount. There is nothing to
      // listen as, and the next screen he loads will have sent him to /login.
      if (!token) return;

      await supabase.realtime.setAuth(token);
      if (stopped) return;

      const next = supabase.channel("live-refresh");
      for (const table of watched) {
        next.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          onChange,
        );
      }
      // Logged so this can never fail silently again. A socket blocked by a
      // firewall, a token that has gone stale, a table missing from the
      // publication — all of them land here, and none of them are visible on the
      // screen itself.
      next.subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.warn("LiveRefresh:", status);
        }
      });
      channel = next;
    }

    void start();

    // An access token lasts an hour and this app is left open for a day. When it
    // is renewed the socket must be told, or it keeps the expired one and goes
    // quiet without disconnecting.
    const { data: auth } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "TOKEN_REFRESHED" && event !== "SIGNED_IN") return;
      if (session?.access_token) {
        void supabase.realtime.setAuth(session.access_token);
      }
    });

    // The two things that can un-block a held refresh.
    document.addEventListener("visibilitychange", flush);
    const unsubscribeOverlays = subscribeOverlays(flush);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", flush);
      unsubscribeOverlays();
      auth.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [key, router]);

  return null;
}
