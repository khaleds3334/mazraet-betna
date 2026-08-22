"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { closeTopOverlay, subscribeOverlays } from "@/lib/overlayStack";

/** The flag on a history entry that exists only to catch one back gesture. */
const GUARD = "__mbBackGuard";

/** How long «دوس رجوع تاني» stands — the toast says it for exactly as long. */
const ARM_MS = 2500;

/** `history.state` is whatever anyone put there. Read it without trusting it. */
function historyState(): Record<string, unknown> {
  const state: unknown = window.history.state;
  return state && typeof state === "object"
    ? (state as Record<string, unknown>)
    : {};
}

/**
 * What the phone's back gesture means inside the installed app (Khaled,
 * 2026-08-22). Mounted once per shell — `/admin` for the admin app, `/` for the
 * customer one — and it turns three different presses into three answers:
 *
 * 1. **A sheet, dialog or drawer is open** → it closes, and nothing else moves.
 * 2. **Anywhere but home** → home, in one press.
 * 3. **Home** → «دوس رجوع تاني عشان تخرج من التطبيق», then the next press closes
 *    the app. The same two-step Instagram uses, and for the same reason: leaving
 *    should take a decision, not a stray swipe.
 *
 * Before this, back walked the browser's history — every tab, every filter, every
 * screen the admin had opened that session, one press at a time, and only then
 * out. On a phone that is not history, it is a maze.
 *
 * ## How it holds
 *
 * A back press is only observable once it has already happened: `popstate` fires
 * *after* the entry is gone. So the app keeps one spare entry — a **guard** —
 * pushed on top of the real one with no URL of its own. The gesture spends the
 * guard, the URL does not change, nothing re-renders, and this handler is free
 * to decide what the press should have meant. Then it pushes a fresh guard.
 *
 * Except on the last press. To close a PWA you cannot call anything — the app
 * exits when the back gesture finds the history empty, and only then. So when
 * the toast goes up the guard is deliberately **not** replaced: the stack is left
 * empty on purpose so the very next press reaches the browser and ends the app.
 * If the toast times out with no second press, the guard goes back up.
 *
 * `depth` is how many entries we sit above the one the app launched on, and it
 * is countable only because **nothing in the app pushes** — every link and every
 * router call replaces, and the guard is the one thing that pushes. Keep it that
 * way: a stray `push` leaves this counting short, and the app takes an extra
 * press to close. On the way out that count is spent in one `go(-depth)`, which
 * lands on the launch entry — the manifest's `start_url`, which is home in both
 * apps — so the collapse is invisible and the stack underneath is empty.
 */
export function BackGuard({ home }: { home: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const depth = useRef(0);
  const armed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapsing = useRef(false);
  // The popstate handler needs the route as it is *now*, not as it was when the
  // listener was attached.
  const here = useRef(pathname);

  useEffect(() => {
    here.current = pathname;
  }, [pathname]);

  /** Put a spare entry back on top, unless we are deliberately without one. */
  const rearm = useCallback(() => {
    if (armed.current) return;
    const state = historyState();
    if (state[GUARD] === true) return;
    // The guard carries a copy of the router's own state — that is what makes
    // popping it a no-op instead of a navigation. An entry the router has not
    // stamped yet has nothing to copy, and popping onto one makes Next reload
    // the page rather than restore it; the retry below comes back for it.
    if (Object.keys(state).length === 0) return;
    window.history.pushState({ ...state, [GUARD]: true }, "");
    depth.current += 1;
  }, []);

  const disarm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    armed.current = false;
  }, []);

  /** Say it once, and leave the stack empty so the next press is the real one. */
  const arm = useCallback(() => {
    armed.current = true;
    toast.info("دوس رجوع تاني عشان تخرج من التطبيق", { duration: ARM_MS });
    timer.current = setTimeout(() => {
      armed.current = false;
      timer.current = null;
      rearm();
    }, ARM_MS);
  }, [rearm, toast]);

  useEffect(() => {
    function onPop() {
      depth.current = Math.max(0, depth.current - 1);

      // Our own `go(-depth)` arriving. We are on the launch entry now, with
      // nothing under it — which is the whole point of having come here.
      if (collapsing.current) {
        collapsing.current = false;
        depth.current = 0;
        // It should be home; if the app was opened somewhere else entirely (a
        // browser tab, not the installed app) it isn't, and going there beats
        // arming an exit the browser would not honour anyway.
        if (window.location.pathname === home) arm();
        else {
          router.replace(home);
          rearm();
        }
        return;
      }

      // A press that beat the disarm timer while the toast was still up. The
      // exit is off — treat it as an ordinary press and put the guard back.
      if (armed.current) {
        disarm();
        rearm();
        return;
      }

      if (closeTopOverlay()) {
        rearm();
        return;
      }

      if (here.current !== home) {
        router.replace(home);
        rearm();
        return;
      }

      // Home already: this press means "leave". Spend the stack in one go so the
      // next press has nothing left to pop and the phone closes the app.
      if (depth.current > 0) {
        collapsing.current = true;
        window.history.go(-depth.current);
        return;
      }

      arm();
    }

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [home, router, arm, disarm, rearm]);

  // A guard on mount, and a fresh one after every route change — a navigation
  // replaces the entry the guard was sitting on. Both also cancel a pending
  // exit: the admin who taps something after seeing the toast has answered it.
  useEffect(() => {
    disarm();
    rearm();
    // On the very first mount the router may not have written its state yet.
    const retry = setTimeout(rearm, 0);
    return () => clearTimeout(retry);
  }, [pathname, disarm, rearm]);

  // Same for opening a sheet. Without this, a sheet opened in the two seconds
  // the toast is up would close the app instead of closing itself.
  useEffect(
    () =>
      subscribeOverlays(() => {
        disarm();
        rearm();
      }),
    [disarm, rearm],
  );

  useEffect(() => () => disarm(), [disarm]);

  return null;
}
