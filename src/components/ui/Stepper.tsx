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
 * either digit set. The value never leaves `min`…`max`, typed or tapped — which
 * is how the order sheet stops at what is left of the flock.
 *
 * A ceiling that only refuses is a broken button. `onMax` fires whenever a tap
 * or a typed number asks for more than `max`, so the screen can say why nothing
 * moved — the admin presses «+» a second time to check, not because he missed
 * it the first time.
 */
export function Stepper({
  value,
  onChange,
  label,
  step = 1,
  min = 0,
  max,
  onMax,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  step?: number;
  min?: number;
  /** Ceiling, when there is one — the birds left in the flock (FR-11). */
  max?: number;
  /** Asked for more than `max`. The caller says why it stopped. */
  onMax?: () => void;
}) {
  const clamp = (n: number) =>
    Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, n));

  /** Set the value, and speak up when the ceiling is what stopped it. */
  function set(wanted: number) {
    if (max !== undefined && wanted > max) onMax?.();
    onChange(clamp(wanted));
  }

  return (
    // Plus first: in this RTL app the first child lands on the right, and the
    // design puts the "+" on the right of the number and the "−" on the left.
    <div className="flex items-center justify-center gap-[18px]">
      <StepButton
        sign="plus"
        label={`زيادة ${label}`}
        onClick={() => set(value + step)}
      />
      <input
        inputMode="numeric"
        // Digits are laid out left-to-right wherever they sit, so in an RTL
        // field the caret lands at the wrong end of them: to fix the last digit
        // of «١.٥٢٠» the admin had to reach past the ١ on the far side. `dir="ltr"`
        // puts the caret where the number ends, which is where he is looking
        // (Khaled, 2026-08-21). Both fields are centred, so nothing moves.
        dir="ltr"
        aria-label={label}
        placeholder="٠"
        size={Math.max(1, String(value || "٠").length)}
        value={value > 0 ? toArabicDigits(value) : ""}
        onChange={(e) => {
          const digits = toLatinDigits(e.target.value);
          if (digits === "") onChange(min);
          else set(Number(digits));
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
