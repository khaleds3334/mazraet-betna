"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, WeightBadge } from "@/components/ui";
import { OFFERED_WEIGHTS } from "@/lib/constants";

/**
 * «الاوزان المتوفرة» — the row of weight badges the admin ticks, and the arrow
 * that says the row goes on past the edge of the screen.
 *
 * Eight badges are wider than any phone, so the row scrolls sideways on its own.
 * The only thing saying so was the browser's own grey scrollbar, which on a
 * phone appears while you drag and fades the moment you stop — it cannot tell
 * you there is something there before you have already found it (Khaled,
 * 2026-08-22). The arrow sits opposite the heading and moves the row a
 * screenful at a time.
 *
 * It turns around at the end rather than disappearing: an arrow that vanishes
 * leaves the admin holding a row scrolled away from the badges he started on,
 * with nothing to press to get back. Pointing home and going all the way there
 * in one tap is shorter than paging back, and it never leaves him mid-row.
 *
 * The arrow is not the only affordance — the row still drags — so it is hidden
 * outright when every badge already fits, rather than sitting there inert.
 */
export function WeightsRow({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (weight: number) => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  /** Whether the row scrolls at all — false when the badges all fit. */
  const [scrolls, setScrolls] = useState(false);
  /** At the far end: the arrow turns around and points back to the start. */
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = row.current;
    if (!el) return;

    const span = el.scrollWidth - el.clientWidth;
    if (span <= 1) {
      setScrolls(false);
      setAtEnd(false);
      return;
    }

    // In RTL the row starts at its right edge and `scrollLeft` counts away from
    // it — negative in every current browser. The distance travelled is what
    // matters here, not its sign.
    setScrolls(true);
    setAtEnd(Math.abs(el.scrollLeft) >= span - 1);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  function step() {
    const el = row.current;
    if (!el) return;

    if (atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    // Forward through the row is leftwards on the screen in RTL. A little under
    // a full screenful, so the badge at the edge stays half in view and the row
    // reads as one continuous strip rather than a set of pages.
    el.scrollBy({ left: -el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-right text-base text-heading">الاوزان المتوفرة</p>

        {scrolls && (
          <button
            type="button"
            onClick={step}
            aria-label={atEnd ? "ارجع لأول الاوزان" : "شوف باقي الاوزان"}
            className="-my-2 flex size-11 shrink-0 items-center justify-center text-foreground"
          >
            <Icon
              name={atEnd ? "arrowRight" : "arrowLeft"}
              size={28}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        )}
      </div>

      {/* The row scrolls on its own. Eight 70px badges are wider than a phone,
          and left in the page flow they made the whole screen scroll sideways
          — every other section drifting with them. `-mx-screen` + matching
          padding lets it run edge to edge while the rest of the page keeps its
          margin, and `overscroll-x-contain` stops a swipe that runs out of
          badges from turning into a back-navigation.

          `no-scrollbar` because the arrow above is what says the row continues:
          the system bar underneath was saying it a second time, in grey, under
          a row of designed badges. */}
      <div
        ref={row}
        role="group"
        onScroll={measure}
        className="no-scrollbar -mx-screen flex items-center gap-3 overflow-x-auto overscroll-x-contain px-screen pb-1"
      >
        {OFFERED_WEIGHTS.map((weight) => (
          <WeightBadge
            key={weight}
            weight={weight}
            selected={selected.includes(weight)}
            onSelect={() => onToggle(weight)}
          />
        ))}
      </div>
    </div>
  );
}
