"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { WeightBadge } from "./WeightBadge";

/**
 * A titled row of weight badges that scrolls sideways, with the arrow that says
 * so.
 *
 * Two screens draw this and mean different things by it — settings ticks which
 * weights the farm offers at all, an order picks one of them — so the shape is
 * here and the meaning stays with each caller (Khaled, 2026-08-23). What is
 * shared is everything visual: the heading, the arrow, the scrolling.
 *
 * ## The arrow
 *
 * Eight badges are wider than any phone, so the row scrolls on its own. The only
 * thing saying so was the browser's grey scrollbar, which on a phone appears
 * while you drag and fades the moment you stop — it cannot tell you there is
 * something there before you have already found it (Khaled, 2026-08-22). The
 * arrow sits opposite the heading and moves the row a screenful at a time.
 *
 * It turns around at the end rather than disappearing: an arrow that vanishes
 * leaves the row scrolled away from the badges it started on, with nothing to
 * press to get back. Pointing home and going all the way there in one tap is
 * shorter than paging back, and it never leaves anyone mid-row.
 *
 * The arrow is not the only affordance — the row still drags — so it is hidden
 * outright when every badge already fits, rather than sitting there inert.
 */
export function WeightRow({
  title,
  weights,
  isSelected,
  onSelect,
  multiSelect = false,
  selectionLabel,
}: {
  /** The question above the row, in the caller's own words. */
  title: string;
  weights: number[];
  isSelected: (weight: number) => boolean;
  onSelect: (weight: number) => void;
  /** True when several may be on at once — settings, not an order. */
  multiSelect?: boolean;
  /** What a screen reader calls the group. */
  selectionLabel: string;
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
        <p className="text-right text-base text-heading">{title}</p>

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
          and left in the page flow they made the whole screen scroll sideways —
          every other section drifting with them. `bleed-screen` lets it run edge
          to edge while the rest of the page keeps its margin, and
          `overscroll-x-contain` stops a swipe that runs out of badges from
          turning into a back-navigation.

          **No gap between the badges.** Each one is a 70px box around a glyph
          that fills about 54 of it, so it brings its own 8px either side; a gap
          on top of that pushed them apart and pushed the first one away from the
          margin (Khaled, 2026-08-23). `--bleed-trim` takes that same 8px back off
          the row's padding, so the first badge's *ink* — not its box — lines up
          with the heading above it.

          `no-scrollbar` because the arrow above is what says the row continues:
          the system bar underneath was saying it a second time, in grey, under
          a row of designed badges. */}
      <div
        ref={row}
        role={multiSelect ? "group" : "radiogroup"}
        aria-label={selectionLabel}
        onScroll={measure}
        style={{ "--bleed-trim": "8px" } as React.CSSProperties}
        className="no-scrollbar bleed-screen flex items-center overflow-x-auto overscroll-x-contain"
      >
        {weights.map((weight) => (
          <WeightBadge
            key={weight}
            weight={weight}
            selected={isSelected(weight)}
            onSelect={() => onSelect(weight)}
          />
        ))}
      </div>
    </div>
  );
}
