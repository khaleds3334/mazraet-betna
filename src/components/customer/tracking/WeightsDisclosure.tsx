"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { WeightsSection } from "@/components/shared/invoice/WeightsSection";
import type { Invoice } from "@/lib/calculations/invoice";
import { cn } from "@/lib/utils";

/**
 * Bring the table the customer just opened into view, so they never have to
 * scroll to the thing they asked to see.
 *
 * Three things make this more than a `scrollIntoView`:
 *
 * 1. **The page does not scroll — `<main>` does** (the customer shell pins the
 *    body to the viewport), so the scrolling is done to that element.
 * 2. **A pinned header covers the top of it.** Scrolling the table's top to the
 *    top of the scrollport would slide it under the order number. The header
 *    measures itself (`data-sticky-header`) rather than being written down here
 *    as a number that would rot the next time the header changes.
 * 3. **A floating «تواصل معنا» pill covers the bottom.** So the scroll goes to
 *    the very bottom of the content, not to the bottom of the table — the page's
 *    own `pb-contact` is exactly the pill's clearance, and landing on it parks
 *    the last row above the pill instead of behind it.
 *
 * A table taller than the screen cannot be shown whole, and then the clamp wins:
 * it stops with the head of the table just under the header, which is where you
 * start reading, rather than at its end.
 */
function revealTable(scroller: Element, table: HTMLElement) {
  const covered =
    scroller
      .querySelector("[data-sticky-header]")
      ?.getBoundingClientRect().height ?? 0;

  const tableTop =
    scroller.scrollTop +
    table.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top;

  const target = Math.min(
    scroller.scrollHeight - scroller.clientHeight,
    tableTop - covered,
  );

  // Only ever downwards: the table is below the button that opened it, and
  // yanking the screen back up would lose the total it is being compared to.
  if (target > scroller.scrollTop) {
    scroller.scrollTo({ top: target, behavior: "smooth" });
  }
}

/**
 * «عرض الاوزان بالتفصيل» (C-44) — the invoice's total opened up into the bird-by
 * bird table it was reached from.
 *
 * Folded away by default because that is the honest default: the customer came
 * to see what the order costs, and the table is the proof behind it, wanted only
 * by whoever doubts the number. It is the same `WeightsSection` the admin's
 * invoice sheet shows, so the two can never quote different weights.
 *
 * Kept in the page rather than opened as a sheet, exactly as the design draws
 * it — the table belongs under the total it explains, and a sheet would hide the
 * total it is being compared against.
 *
 * **It moves the page both ways.** Opening scrolls the table into view; closing
 * puts the reader back exactly where they were standing before they opened it.
 * Without the second half the tap leaves them stranded: the table was hundreds
 * of pixels of content and the browser answers its removal by clamping the
 * scroll to the shorter page — which lands wherever it lands, usually halfway up
 * an invoice they had already read.
 */
export function WeightsDisclosure({ invoice }: { invoice: Invoice }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLDivElement>(null);
  /** Where the page was standing before the table pushed it down. */
  const wasAt = useRef(0);
  const settled = useRef(false);

  useEffect(() => {
    // Nothing to move on the first render — the table is closed and the page is
    // wherever the reader left it.
    if (!settled.current) {
      settled.current = true;
      return;
    }

    const scroller = root.current?.closest("main");
    if (!scroller) return;

    if (open) {
      // Read before moving. The table is in the DOM by now but it grew *below*
      // the fold, so nothing has scrolled yet and this is still the position the
      // reader chose.
      wasAt.current = scroller.scrollTop;
      if (table.current) revealTable(scroller, table.current);
      return;
    }

    scroller.scrollTo({
      top: Math.min(wasAt.current, scroller.scrollHeight - scroller.clientHeight),
      behavior: "smooth",
    });
  }, [open]);

  return (
    <div ref={root} className="flex flex-col gap-4">
      {/* `inline-flex` so the button is only as wide as its words and starts at
          the inline start — the right, in RTL — which is where the design hangs
          it. The row is the label with the chevron to its left.
          (Not `mx-screen`: there is no such utility, only `px-screen` — T-62.) */}
      <div className="px-screen">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex min-h-11 items-center gap-1 text-base text-foreground"
        >
          <span className="optical-center">عرض الاوزان بالتفصيل</span>
          <Icon
            name="arrowDown"
            size={24}
            aria-hidden
            className={cn("transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {/* Full-bleed: `WeightsSection` runs its own lime band edge to edge and
          keeps the gutter on everything under it. */}
      {open && (
        <div ref={table}>
          <WeightsSection invoice={invoice} />
        </div>
      )}
    </div>
  );
}
