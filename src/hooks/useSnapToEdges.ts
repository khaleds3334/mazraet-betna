"use client";

import { useEffect } from "react";

/**
 * Turns a nudge into a whole page: any real downward scroll carries the screen
 * to its foot, any upward one back to its head (Khaled, 2026-08-25).
 *
 * It suits the order screen because that screen has exactly two things to look
 * at — «كام فرخة» at the top, and everything you answer after it — and asking
 * this customer to land his thumb precisely between them is asking for the one
 * thing he is worst at. One flick, and he is where he was going. It pairs with
 * the confirm bar, which is keyed to the same direction: the page arrives at the
 * bottom and the nav unfolds the button in the same breath.
 *
 * **It holds only while the screen is barely taller than the phone, and checks
 * every time** (`MAX_OVERFLOW`). A screen with two screenfuls of scroll in it
 * has a middle, and a middle is exactly what snapping to the ends makes
 * unreachable: nudge down and you are past it, nudge up and you are behind it,
 * and the weights in between can never be landed on. This form fits the rule on
 * a 393×852 phone — it runs over by about one section — but on a short phone,
 * or once a section is added to it, the rule stops being true and the snapping
 * turns itself off rather than trapping him.
 *
 * ## Why it animates by hand
 *
 * `scrollTo({ behavior: "smooth" })` was the first version and read as slow
 * (Khaled, 2026-08-25). Its duration is the browser's and grows with the
 * distance, so the longer the screen the more sluggish the flick feels — and
 * there is no property that changes it. `DURATION` below is the whole point of
 * doing this by hand: one length, the same on every phone and every distance.
 *
 * It is also why `revealTop` is exported from here rather than left to
 * `scrollIntoView`. Any scroll this hook did not start looks to it exactly like
 * a finger, so a browser-run scroll would be read as a gesture and snapped away
 * mid-flight. One owner of the scroll, one animation, one lock.
 *
 * ## Two things that make it behave
 *
 * **It waits for the finger.** A gesture crosses the threshold long before it
 * ends, and animating the scroll under a thumb that is still dragging is a
 * tug-of-war the thumb loses badly. So a gesture that starts while touching
 * only records where it wants to go, and travels on `touchend`. Touching down
 * again stops it mid-flight — the page is never taken away from a hand that has
 * come back for it.
 *
 * **Sideways scrollers are ignored.** The weights row, the day strip and the
 * tray all scroll horizontally and report `scrollTop` 0; left in, a sideways
 * swipe read as a jump to the top and snapped the page there under the finger.
 * Same filter, and the same reason, as `useScrollDirection`.
 */

/** Below this, a scroll is a wobble and not a gesture. Matches the direction hook. */
const THRESHOLD = 6;

/** The whole trip, near or far. Short enough to read as the flick's own follow-through. */
const DURATION = 240;

/**
 * How much scroll a screen may have before snapping switches itself off, as a
 * share of one screenful. Half a screen of overflow still reads as one screen
 * with a tail; a whole one has a middle to get stranded in — see above.
 */
const MAX_OVERFLOW = 0.5;

/**
 * The animation's state, at module scope because there is one scrolling screen
 * at a time and `revealTop` has to share the lock with the hook's listeners. A
 * second animation stealing the first one's frames is the one failure this
 * cannot recover from.
 */
let frame = 0;
let running = false;
/** Where the page was when it was last looked at, so a gesture has something to measure against. */
let last: number | null = null;

/** Fast off the mark, easing into the edge — never a bounce, it is a page not a toy. */
function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

function travel(el: HTMLElement, to: number) {
  const from = el.scrollTop;
  if (Math.abs(to - from) < 1) return; // already there
  const started = performance.now();
  cancelAnimationFrame(frame);
  running = true;

  function step(now: number) {
    const t = Math.min((now - started) / DURATION, 1);
    el.scrollTop = from + (to - from) * easeOut(t);
    if (t < 1) {
      frame = requestAnimationFrame(step);
      return;
    }
    running = false;
    // The last frame's scroll event can arrive after this, and would otherwise
    // be measured against wherever the page started.
    last = el.scrollTop;
  }

  frame = requestAnimationFrame(step);
}

/** The nearest ancestor that actually scrolls vertically. */
function scrollerOf(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === "auto" || overflow === "scroll") return node;
  }
  return null;
}

/**
 * Bring `el` to the top of the screen, on the same animation a flick gets.
 *
 * Used to carry the customer back to the question he skipped: the confirm button
 * is at the foot of the page and «اختار عدد الفراخ الأول» means nothing while
 * the counter is a screen away (Khaled, 2026-08-25). The toast says what is
 * missing, this puts it in front of him.
 */
export function revealTop(el: HTMLElement | null) {
  if (!el) return;
  const box = scrollerOf(el);
  if (!box) return;

  const offset = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
  const to = Math.max(
    0,
    Math.min(box.scrollTop + offset, box.scrollHeight - box.clientHeight),
  );
  travel(box, to);
}

export function useSnapToEdges(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    /** Set while a finger is down and a gesture is waiting for it to lift. */
    let waiting: HTMLElement | null = null;
    let target = 0;
    let touching = false;

    function onScroll(event: Event) {
      const el = event.target;
      if (!(el instanceof HTMLElement)) return;
      // Sideways-only scroller — see above.
      if (el.scrollHeight <= el.clientHeight) return;
      // Re-read on every gesture and not once on mount: the form grows and
      // shrinks under the customer as panels open and the note unfolds.
      if (el.scrollHeight - el.clientHeight > el.clientHeight * MAX_OVERFLOW) {
        return;
      }

      const top = el.scrollTop;
      // Our own animation scrolls too. Keep reading position through it so the
      // next gesture is measured from where the page actually landed.
      if (running || last === null) {
        last = top;
        return;
      }

      const delta = top - last;
      last = top;
      if (Math.abs(delta) < THRESHOLD) return;

      // Re-read every time: a drag that turns around before the finger lifts
      // should end up wherever it was last headed.
      target = delta > 0 ? el.scrollHeight - el.clientHeight : 0;
      if (touching) {
        waiting = el;
        return;
      }
      travel(el, target);
    }

    function onTouchStart() {
      touching = true;
      waiting = null;
      cancelAnimationFrame(frame);
      running = false;
    }

    function onTouchEnd() {
      touching = false;
      if (!waiting) return;
      travel(waiting, target);
      waiting = null;
    }

    const passive = { passive: true } as const;
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    document.addEventListener("touchstart", onTouchStart, passive);
    document.addEventListener("touchend", onTouchEnd, passive);
    document.addEventListener("touchcancel", onTouchEnd, passive);

    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
      cancelAnimationFrame(frame);
      running = false;
      last = null;
    };
  }, [enabled]);
}
