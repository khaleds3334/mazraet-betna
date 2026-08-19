"use client";

import { useState } from "react";
import { StepButton } from "@/components/ui";
import { WEIGHT_STEP_KG } from "@/lib/constants";
import { formatArabicNumber, formatWeight, parseWeight } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TrashGlyph } from "./glyphs";

/** Weights are stored to the gram — never let float noise past this. */
const toGrams = (kg: number) => Math.round(kg * 1000) / 1000;

/**
 * One bird on the weighing sheet (A-52). Reading right to left: which bird it
 * is, then `＋ الوزن －`, then the unit — replaced on the last row by the button
 * that drops the bird from the order (FR-14ج).
 *
 * A row the admin hasn't reached yet shows the weight the customer asked for, in
 * grey, and that is where ＋/－ start from. The number is a real input: the admin
 * reads 1.840 off the scale and types it, which beats 32 taps of ＋. The steppers
 * are for the correction after, 5 grams a tap.
 */
export function WeighingRow({
  index,
  approxWeight,
  weight,
  onChange,
  onRemove,
}: {
  index: number;
  approxWeight: number | null;
  /** null until this bird has been weighed. */
  weight: number | null;
  onChange: (weight: number) => void;
  /** Only the last row gets one — that is where the design puts the bin. */
  onRemove?: () => void;
}) {
  // What the admin has typed so far. Held raw, because parsing every keystroke
  // would fight him over the decimal point — "1." is not a number yet.
  const [typed, setTyped] = useState<string | null>(null);

  const shown = weight ?? approxWeight ?? 0;
  const weighed = weight != null;
  const bird = formatArabicNumber(index);

  function commit() {
    if (typed == null) return; // focused and left again — not an edit
    const parsed = parseWeight(typed);
    setTyped(null);
    if (parsed != null && parsed > 0) onChange(toGrams(parsed));
  }

  return (
    <div className="flex items-center">
      <span className="w-9 shrink-0 text-h5 font-bold text-heading">
        {bird}.
      </span>

      <div className="flex flex-1 items-center justify-between border-b-2 border-surface py-3">
        <div className="flex flex-1 items-center justify-center gap-4">
          <StepButton
            sign="plus"
            label={`زيادة وزن الفرخة ${bird}`}
            onClick={() => onChange(toGrams(shown + WEIGHT_STEP_KG))}
          />
          <input
            inputMode="decimal"
            aria-label={`وزن الفرخة ${bird} بالكيلو`}
            value={typed ?? formatWeight(shown, { withUnit: false })}
            onFocus={(event) => event.target.select()}
            onChange={(event) => setTyped(event.target.value)}
            onBlur={commit}
            className={cn(
              "w-24 min-w-0 bg-transparent text-center text-h5 font-bold outline-none",
              weighed ? "text-heading" : "text-disabled-soft",
            )}
          />
          <StepButton
            sign="minus"
            label={`تقليل وزن الفرخة ${bird}`}
            onClick={() =>
              onChange(toGrams(Math.max(0, shown - WEIGHT_STEP_KG)))
            }
          />
        </div>

        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`امسح الفرخة ${bird}`}
            className="flex size-11 shrink-0 items-center justify-center text-error-soft"
          >
            <TrashGlyph size={28} />
          </button>
        ) : (
          <span
            className={cn(
              "shrink-0 text-h5 font-bold",
              weighed ? "text-heading" : "text-disabled-soft",
            )}
          >
            كجم
          </span>
        )}
      </div>
    </div>
  );
}
