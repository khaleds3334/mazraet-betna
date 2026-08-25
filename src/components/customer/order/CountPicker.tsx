"use client";

import { RequiredMark, Stepper } from "@/components/ui";
import { ChickenTray } from "./ChickenTray";

/**
 * «محتاج كام فرخة؟» — the tray beside the counter (C-20, Figma 2316:5283).
 *
 * The tray is the counter's answer drawn back at the customer. That matters more
 * here than anywhere else in the app: this customer is often elderly, and «٤» as
 * a numeral is a symbol he has to read, where four birds in a tray is a thing he
 * can see. The two say the same number, and either one is enough on its own.
 *
 * The stepper is the shared one — the same control the admin uses on A-56, down
 * to the press-and-hold. Nothing about counting birds differs between the two
 * apps, and the ceiling behaves the same way too: «+» stops at what is left of
 * the flock and the screen says why (FR-11).
 */
export function CountPicker({
  count,
  onChange,
  max,
  onMax,
  missing = false,
}: {
  count: number;
  onChange: (next: number) => void;
  /** Birds still free to book. */
  max: number;
  /** Asked for more than there are — the screen says how many there are. */
  onMax: () => void;
  /** Star the question — the order was sent with no count picked. */
  missing?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white px-screen py-4">
      {/* The prompt and counter come FIRST in the DOM, which in RTL puts them on
          the right and the tray on the left — the order the design draws
          (Figma 3855:1341). Writing the tray first mirrors the whole row. */}
      <div className="flex w-full items-center justify-center">
        {/* `items-start` is the right-hand edge here — the column is RTL, so the
            prompt sits against the card's right margin, in line with the section
            headings below it. `gap-1` and the counter's own `px-1 py-2.5` are the
            4px / 4px / 10px the design measures (Figma 3906:13771). */}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1 pb-7">
          <p className="whitespace-nowrap text-base text-heading">
            {missing && <RequiredMark />}
            محتاج كام فرخة؟
          </p>
          <div className="w-full px-1 py-2.5">
            <Stepper
              value={count}
              onChange={onChange}
              label="عدد الفراخ"
              min={0}
              max={max}
              onMax={onMax}
              // Tapped, never typed — the number hugs its glyph, and the two
              // buttons sit closer than the design's 18px. Measured on the phone
              // rather than on the canvas: «٠» is a narrow glyph, so 18px either
              // side of it reads as a hole (Khaled, 2026-08-23).
              variant="counter"
              gapPx={18}
            />
          </div>
        </div>

        <ChickenTray count={count} />
      </div>
    </div>
  );
}
