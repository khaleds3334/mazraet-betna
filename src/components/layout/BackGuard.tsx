"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { getBackTarget } from "@/lib/backTarget";
import { askBeforeLeaving } from "@/lib/leaveGuard";
import { closeTopOverlay, subscribeOverlays } from "@/lib/overlayStack";

/** Where an entry sits above the one the app launched on, written into it. */
const INDEX = "__mbIndex";

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
 * 2. **A screen with unsaved work** → it asks, and decides for itself what the
 *    press meant once the user has answered (`leaveGuard`).
 * 3. **A screen with a back button** → wherever that button goes, so the swipe
 *    and the button agree (`backTarget`).
 * 4. **Anywhere else but home** → home, in one press.
 * 4. **Home** → «دوس رجوع تاني عشان تخرج من التطبيق», then the next press closes
 *    the app. The same two-step Instagram uses, and for the same reason: leaving
 *    should take a decision, not a stray swipe.
 *
 * Before this, back walked the browser's history — every tab, every filter, every
 * screen the admin had opened that session, one press at a time, and only then
 * out. On a phone that is not history, it is a maze.
 *
 * ## How it holds
 *
 * A back press is only observable once it has happened: `popstate` fires *after*
 * the entry is gone. So the app keeps one spare entry — a **guard** — pushed on
 * top of the real one with no URL of its own. The gesture spends the guard, the
 * URL does not change, nothing re-renders, and this handler is free to decide
 * what the press should have meant. Then it pushes a fresh guard.
 *
 * Except on the last press. Nothing can close a PWA — it exits when the gesture
 * finds the history empty, and only then. So when the toast goes up the guard is
 * deliberately **not** replaced, and the stack is spent in one `go(-index)` that
 * lands on the entry the app launched on: the manifest's `start_url`, which is
 * home in both apps, so the collapse is invisible. The next press reaches the
 * browser and ends the app. If the toast times out, or the admin taps a sheet or
 * another screen while it is up, the guard goes back and the exit is off.
 *
 * ## Two things it is careful about
 *
 * **It never asks the history what it did.** Whether a guard is on top, and how
 * deep the stack is, are held here — because the router owns `history.state` and
 * rewrites it on its own schedule, dropping foreign keys when it navigates and
 * keeping them when it restores. The index is still *written* into each entry,
 * but only as a correction to read back if the browser lands somewhere we did
 * not put it; between presses the ref is what is trusted.
 *
 * **It never navigates from inside the popstate handler.** The router registers
 * its own `popstate` listener after this one, and answers every press by
 * restoring the entry that was just popped. A `router.replace` called from in
 * here is dispatched first and overwritten a moment later, so the press appears
 * to do nothing at all. Going home is queued for the next task instead, after
 * that restore has been dispatched, and then it is the one that lands.
 *
 * `index` is countable only because **nothing in the app pushes** — every link
 * and every router call replaces, and the guard is the one thing that pushes.
 * Keep it that way.
 */
export function BackGuard({ home }: { home: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  /** How far above the launch entry we are. */
  const index = useRef(0);
  /** Whether the spare entry is on top right now. Ours to know, not history's. */
  const guarded = useRef(false);
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
    if (armed.current || guarded.current) return;
    index.current += 1;
    // `__NA` is what marks an entry the router is willing to restore rather than
    // reload. The guard carries over whatever the router has already written
    // here and says it again, so a guard pushed before the router has stamped
    // this entry still comes back as a restore.
    window.history.pushState(
      { __NA: true, ...historyState(), [INDEX]: index.current },
      "",
    );
    guarded.current = true;
  }, []);

  /** Write our position into the entry, so a stray landing can be corrected. */
  const stamp = useCallback(() => {
    window.history.replaceState(
      { ...historyState(), [INDEX]: index.current },
      "",
    );
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
    /**
     * Back, but not from inside the handler — see the note above. A screen that
     * draws a back button has said where that leads; anything else means home.
     * A target equal to where we already are is ignored, so a stale one can
     * never strand the press on the same screen.
     */
    const goBack = () => {
      const target = getBackTarget();
      const to = target && target !== here.current ? target : home;
      setTimeout(() => router.replace(to), 0);
    };

    function onPop() {
      // Whatever we were standing on is gone.
      guarded.current = false;

      const stamped = historyState()[INDEX];
      index.current =
        typeof stamped === "number" ? stamped : Math.max(0, index.current - 1);

      // Our own `go(-index)` arriving. We are on the launch entry now, with
      // nothing under it — which is the whole point of having come here.
      if (collapsing.current) {
        collapsing.current = false;
        index.current = 0;
        // It should be home; if the app was opened somewhere else entirely (a
        // browser tab, not the installed app) it isn't, and going there beats
        // arming an exit the browser would not honour anyway.
        if (window.location.pathname === home) arm();
        else {
          rearm();
          setTimeout(() => router.replace(home), 0);
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

      // A screen holding unsaved work gets to ask first. The guard opens its own
      // dialog and calls back if the user says go — which is why the press is
      // spent here either way, and why the guard is asked after the overlay
      // check: the next press should close that dialog, not re-ask.
      if (askBeforeLeaving(goBack)) {
        rearm();
        return;
      }

      if (here.current !== home) {
        rearm();
        goBack();
        return;
      }

      // Home already: this press means "leave". Spend the stack in one go so the
      // next press has nothing left to pop and the phone closes the app.
      if (index.current > 0) {
        collapsing.current = true;
        window.history.go(-index.current);
        return;
      }

      arm();
    }

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [home, router, arm, disarm, rearm]);

  // A guard on mount, and a fresh one after every route change — a navigation
  // lands on the entry the guard was sitting on and overwrites it, spare and
  // all. Both also cancel a pending exit: the admin who taps something after
  // seeing the toast has answered it.
  useEffect(() => {
    guarded.current = false;
    disarm();
    stamp();
    rearm();
  }, [pathname, disarm, rearm, stamp]);

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
