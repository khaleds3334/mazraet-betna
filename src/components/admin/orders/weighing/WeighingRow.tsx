"use client";

import { useState } from "react";
import { StepButton } from "@/components/ui";
import { WEIGHT_STEP_KG } from "@/lib/constants";
import { formatArabicNumber, formatWeight, toArabicDigits, toLatinDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TrashGlyph } from "./glyphs";

/** Weights are stored to the gram — never let float noise past this. */
const toGrams = (kg: number) => Math.round(kg * 1000) / 1000;

/** One kilo digit, then up to three gram digits. Nothing here weighs ten kilos. */
const MAX_DIGITS = 4;

/** Everything the admin typed that was a digit, capped at what a weight can hold. */
const readDigits = (text: string): string =>
  toLatinDigits(text).slice(0, MAX_DIGITS);

/**
 * The digit stream as a weight: `2` → `2.`, `22` → `2.2`, `2250` → `2.250`.
 *
 * The point appears with the first digit and then stays put, so the number grows
 * to the right of it the way it does on the scale's own display — and the admin
 * can see, mid-entry, that the app read `٢٢٥` as two and a quarter kilos rather
 * than as two hundred.
 */
function withPoint(digits: string): string {
  if (digits === "") return "";
  return `${digits[0]}.${digits.slice(1)}`;
}

/**
 * The new digit stream after an edit — the part that makes backspace work.
 *
 * The point is written by the field, not by the admin, so it cannot be the thing
 * that a backspace deletes: `٢.` would lose its point, the field would put it
 * straight back, and the ٢ could never be cleared (Khaled, 2026-08-21). When the
 * text got shorter but the digits did not, the character he removed was the
 * point, and what he meant was the digit in front of it.
 */
function afterEdit(text: string, previous: string | null): string {
  const digits = readDigits(text);
  const shown = previous == null ? "" : withPoint(previous);

  return digits === previous && text.length < shown.length
    ? digits.slice(0, -1)
    : digits;
}

/**
 * One bird on the weighing sheet (A-52). Reading right to left: which bird it
 * is, then `＋ الوزن －`, then the unit — replaced on the last row by the button
 * that drops the bird from the order (FR-14ج).
 *
 * A row the admin hasn't reached yet shows the weight the customer asked for, in
 * grey, and that is where ＋/－ start from. The number is a real input: the admin
 * reads 1.840 off the scale and types it, which beats 32 taps of ＋. The steppers
 * are for the correction after, 5 grams a tap.
 *
 * **He types digits; the field places the decimal point** (Khaled, 2026-08-21).
 * `2250` becomes `٢.٢٥٠`, because no bird weighs two whole kilos-worth of digits —
 * the first digit is always the kilos and everything after it is grams. Reaching
 * for a decimal point on a phone keypad, one-handed, over a scale, to type a
 * separator that could only ever go in one place, is a tap that exists for the
 * software's benefit. Typing the dot anyway still works: it is stripped with
 * everything else that isn't a digit, and lands in the same place.
 *
 * The digits appear Arabic-Indic as they are typed, not after (rule 3): the field
 * holds the digit stream and renders it formatted, rather than letting the phone's
 * own text sit in the box until something converts it.
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
  // The digits he has typed, in order, with no separator — null while he is not
  // typing at all, which is when the field shows the stored weight instead.
  const [typed, setTyped] = useState<string | null>(null);

  const shown = weight ?? approxWeight ?? 0;
  const weighed = weight != null;
  const bird = formatArabicNumber(index);

  function commit() {
    if (typed == null) return; // focused and left again — not an edit
    const parsed = Number(withPoint(typed));
    setTyped(null);
    if (Number.isFinite(parsed) && parsed > 0) onChange(toGrams(parsed));
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
            // `numeric`, not `decimal`: the keypad no longer needs a dot on it.
            inputMode="numeric"
            // Digits lay out left-to-right wherever they are, so an RTL field puts
            // the caret at the wrong end of them — «امسح آخر رقم» meant reaching
            // for the left edge. The box is centred either way (T-51 note).
            dir="ltr"
            aria-label={`وزن الفرخة ${bird} بالكيلو`}
            value={
              typed == null
                ? formatWeight(shown, { withUnit: false })
                : toArabicDigits(withPoint(typed))
            }
            onFocus={(event) => event.target.select()}
            onChange={(event) => setTyped(afterEdit(event.target.value, typed))}
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
