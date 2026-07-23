"use client";

import { useState } from "react";
import { toArabicDigits } from "@/lib/format";
import type { FeedWithdrawal } from "@/lib/queries/cycles";
import { FeedWithdrawalDetail } from "./FeedWithdrawalDetail";

const COLUMNS = 10;

/**
 * "تتبع استهلاك العلف" — a calendar of the whole cycle: one square per day, from
 * day 1 until the flock is sold (~40 days), 10 per row. A square lights up on any
 * day a feed bag was withdrawn, and tapping a lit square opens its bag-detail
 * popup (A-13). The grid grows **upward from the bottom-left**: day 1 is the
 * bottom-left square, days run left→right along the bottom row, and each new row
 * stacks on top. Fluid (aspect-square cells) so it never overflows the 320px floor.
 */
export function FeedGrid({
  totalDays,
  withdrawals,
}: {
  totalDays: number;
  withdrawals: FeedWithdrawal[];
}) {
  const [selected, setSelected] = useState<FeedWithdrawal | null>(null);

  // Day offset → the (first) bag opened that day, so a lit cell knows its detail.
  const byDay = new Map<number, FeedWithdrawal>();
  for (const w of withdrawals) {
    if (!byDay.has(w.dayOffset)) byDay.set(w.dayOffset, w);
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
            return <div key={`gap-${i}`} aria-hidden className="aspect-square" />;
          }
          const withdrawal = byDay.get(day);
          const label = `اليوم ${toArabicDigits(day + 1)}`;
          if (withdrawal) {
            return (
              <button
                key={day}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => setSelected(withdrawal)}
                className="aspect-square rounded-[3px] border border-border bg-accent-orange transition-transform active:scale-95"
              />
            );
          }
          return (
            <div
              key={day}
              title={label}
              className="aspect-square rounded-[3px] border border-border bg-background"
            />
          );
        })}
      </div>

      <FeedWithdrawalDetail withdrawal={selected} onClose={() => setSelected(null)} />
    </>
  );
}
