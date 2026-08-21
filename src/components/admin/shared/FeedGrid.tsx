"use client";

import { useState } from "react";
import { FEED_PHASE_FILL } from "@/lib/feedColors";
import { toArabicDigits } from "@/lib/format";
import type { FeedWithdrawal } from "@/lib/queries/cycles";
import { cn } from "@/lib/utils";
import { FeedWithdrawalDetail } from "./FeedWithdrawalDetail";

const COLUMNS = 10;

/**
 * A half bag shades half its square, cut corner to corner — the first half on the
 * left, the second on the right, so the two halves of one bag would tile the
 * square between them (D-48). Drawn with `clip-path` rather than a rotated
 * pseudo-element: one property, no extra box to keep inside the rounded corner.
 */
const HALF_CLIP: Record<"first" | "second", string> = {
  first: "polygon(0 0, 100% 0, 0 100%)",
  second: "polygon(100% 0, 100% 100%, 0 100%)",
};

/** What one day of the grid is: everything opened that day, and the first of them. */
interface DayCell {
  bags: number;
  first: FeedWithdrawal;
  beyondRequired: boolean;
}

/**
 * "تتبع استهلاك العلف" — a calendar of the whole cycle: one square per day, from
 * day 1 until the flock is sold (~40 days), 10 per row. A square fills on any day
 * feed was opened, and tapping it opens that day's bag-detail popup (A-13). The
 * grid grows **upward from the bottom-left**: day 1 is the bottom-left square,
 * days run left→right along the bottom row, and each new row stacks on top.
 * Fluid (aspect-square cells) so it never overflows the 320px floor.
 *
 * **A square says which feed and how much** (D-48):
 *   • **colour** — بادي lime, نامي tan-orange, the same two colours the «العلف
 *     المسحوب» tile above it prints its figures in (`feedColors.ts`);
 *   • **green** — that opening went past what the cycle was estimated to need.
 *     Green, not red, and for the same reason a surplus in «العلف المطلوب» is
 *     green: «زيادة عن المطلوب» is one idea and gets one colour wherever it shows
 *     up (Khaled, 2026-08-21). The estimate is a forecast, and a flock that eats
 *     past it is worth seeing, not worth alarming him about;
 *   • **a triangle instead of a full square** — half a bag. A half used to fill
 *     the day exactly like a whole one, so a cycle run on halves looked twice as
 *     hungry as it was.
 *
 * A day with two halves on it fills whole: half plus half is a bag, whichever
 * order they were opened in.
 */
export function FeedGrid({
  totalDays,
  withdrawals,
}: {
  totalDays: number;
  withdrawals: FeedWithdrawal[];
}) {
  const [selected, setSelected] = useState<FeedWithdrawal | null>(null);

  // Day offset → everything opened that day. The first opening carries the day's
  // colour and its detail popup; the bags are summed, since two halves make a
  // full square.
  const byDay = new Map<number, DayCell>();
  for (const w of withdrawals) {
    const cell = byDay.get(w.dayOffset);
    if (cell) {
      cell.bags += w.bags;
      cell.beyondRequired = cell.beyondRequired || w.beyondRequired;
    } else {
      byDay.set(w.dayOffset, {
        bags: w.bags,
        first: w,
        beyondRequired: w.beyondRequired,
      });
    }
  }

  // Lay the days out top→bottom for the DOM, but with day 1 at the bottom-left:
  // the top row holds the highest days, the bottom row holds days 1–10. Cells
  // past `totalDays` on the (partial) top row are null spacers that hold their
  // column so the rows stay aligned. `dir="ltr"` puts DOM cell 0 at the top-left.
  const rows = Math.ceil(totalDays / COLUMNS);
  const cells: (number | null)[] = [];
  for (let r = 0; r < rows; r++) {
    const base = (rows - 1 - r) * COLUMNS;
    for (let c = 0; c < COLUMNS; c++) {
      const day = base + c;
      cells.push(day < totalDays ? day : null);
    }
  }

  return (
    <>
      <div
        dir="ltr"
        className="grid grid-cols-10 gap-1"
        role="img"
        aria-label={`${toArabicDigits(byDay.size)} يوم اتسحب فيه علف من ${toArabicDigits(totalDays)} يوم`}
      >
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div key={`gap-${i}`} aria-hidden className="aspect-square" />
            );
          }
          const cell = byDay.get(day);
          const label = `اليوم ${toArabicDigits(day + 1)}`;

          if (!cell) {
            return (
              <div
                key={day}
                title={label}
                className="aspect-square rounded-[3px] border border-border bg-background"
              />
            );
          }

          // Under a whole bag the square keeps its empty-day background, so the
          // shaded half reads as a part of the day rather than as the whole of it.
          const partial = cell.bags < 1 ? cell.first.half : null;
          const fill = cell.beyondRequired
            ? "bg-success"
            : FEED_PHASE_FILL[cell.first.phase];

          return (
            <button
              key={day}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => setSelected(cell.first)}
              className="relative aspect-square overflow-hidden rounded-[3px] border border-border bg-background transition-transform active:scale-95"
            >
              <span
                aria-hidden
                style={
                  partial ? { clipPath: HALF_CLIP[partial] } : undefined
                }
                className={cn("absolute inset-0", fill)}
              />
            </button>
          );
        })}
      </div>

      <FeedWithdrawalDetail
        withdrawal={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
