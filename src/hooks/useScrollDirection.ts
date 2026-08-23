"use client";

import { useEffect, useState } from "react";

/**
 * Which way the page was last moved — `"up"` until something scrolls down.
 *
 * A screen that has not been scrolled at all reports `"up"`, so anything driven
 * by this starts out of the way and arrives on the first downward move (Khaled,
 * 2026-08-24). Nothing should greet a customer by covering the bottom of a page
 * he has not read yet.
 *
 * Listens on `document` in the **capture** phase, not on `window`. Scroll events
 * do not bubble, and in this app the thing that scrolls is not the window: the
 * shell pins itself to the viewport and gives `<main>` its own `overflow-y-auto`
 * so the chrome stays put. Capturing at the document catches that element's
 * scroll without this hook having to know which element it is.
 *
 * **Elements that only scroll sideways are ignored.** The order screen has three
 * of them — the weights row, the day strip, the tray — and their `scrollTop` is
 * always 0. Left in, a sideways swipe read as a jump back to the top of the page
 * and flipped the direction under the finger.
 *
 * `THRESHOLD` is the other half of that: a finger resting on a moving list
 * produces a stream of one-pixel reversals, and each one would otherwise be a
 * direction change.
 */
const THRESHOLD = 6;

export function useScrollDirection(): "up" | "down" {
  const [direction, setDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    let last: number | null = null;

    function onScroll(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      // Sideways-only scroller — see above.
      if (target.scrollHeight <= target.clientHeight) return;

      const top = target.scrollTop;
      if (last === null) {
        last = top;
        return;
      }

      const delta = top - last;
      if (Math.abs(delta) < THRESHOLD) return;

      last = top;
      setDirection(delta > 0 ? "down" : "up");
    }

    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () =>
      document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  return direction;
}
