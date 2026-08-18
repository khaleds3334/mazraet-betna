"use client";

import { toArabicDigits, toLatinDigits } from "@/lib/format";
import { StepButton } from "./StepButton";

/**
 * The big `−  ٩٠  +` stepper from the design (node 3609:3880) — a large centred
 * number flanked by the two step squares. Unlike `NumberStepper` (an underlined
 * field with a "+" only) this one is for a single headline value the admin nudges
 * up and down, e.g. the kilo price when opening the sale.
 *
 * The number is still a real input so a far-off value can be typed instead of
 * tapped 40 times; it carries no box or underline, so it looks exactly like the
 * plain number in the design. Digits show Arabic-Indic (FR-3) and typing accepts
 * either digit set. The value never goes below `min`.
 */
export function Stepper({
  value,
  onChange,
  label,
  step = 1,
  min = 0,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  step?: number;
  min?: number;
}) {
  const clamp = (n: number) => Math.max(min, n);

  return (
    // Plus first: in this RTL app the first child lands on the right, and the
    // design puts the "+" on the right of the number and the "−" on the left.
    <div className="flex items-center justify-center gap-[18px]">
      <StepButton
        sign="plus"
        label={`زيادة ${label}`}
        onClick={() => onChange(clamp(value + step))}
      />
      <input
        inputMode="numeric"
        aria-label={label}
        placeholder="٠"
        size={Math.max(1, String(value || "٠").length)}
        value={value > 0 ? toArabicDigits(value) : ""}
        onChange={(e) => {
          const digits = toLatinDigits(e.target.value);
          onChange(digits === "" ? min : clamp(Number(digits)));
        }}
        className="min-w-[2ch] bg-transparent text-center text-h2 font-bold text-foreground outline-none placeholder:text-disabled-soft"
      />
      <StepButton
        sign="minus"
        label={`تقليل ${label}`}
        onClick={() => onChange(clamp(value - step))}
      />
    </div>
  );
}
