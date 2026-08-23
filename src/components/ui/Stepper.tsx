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
  variant = "field",
  gapPx = 18,
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
  /**
   * What the number in the middle is for, which is the only thing that differs
   * between the two places this control appears.
   *
   * - **`field`** (default) — the admin types into it: a kilo price, a bird
   *   count. The slot never falls below two characters, so clearing it does not
   *   make the buttons jump under his thumb, and its width is left to the
   *   browser's own `size` handling — which is what every admin screen was built
   *   and reviewed against.
   * - **`counter`** — tapped, never typed (the customer's «محتاج كام فرخة؟»).
   *   The number is plain text, so it is exactly as wide as the glyph and «−»
   *   and «+» close up around it. An input could not be sized to fit Arabic-Indic
   *   digits — see the note on `number` below.
   *
   * Kept as one prop rather than two dials because there is one real difference
   * here — typed versus tapped — and everything else follows from it.
   */
  variant?: "field" | "counter";
  /**
   * Space between the number and each button, in px. 18 is the design's
   * (Figma 3906:13771) and the default, so no existing screen moves.
   */
  gapPx?: number;
}) {
  const clamp = (n: number) =>
    Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, n));

  /** Set the value, and speak up when the ceiling is what stopped it. */
  function set(wanted: number) {
    if (max !== undefined && wanted > max) onMax?.();
    onChange(clamp(wanted));
  }

  const digits = Math.max(1, String(value || "٠").length);

  // A `field` keeps exactly the markup it always had — same `size` attribute,
  // same 2ch floor — so no admin screen shifts by a pixel on account of the
  // customer's counter.
  const isCounter = variant === "counter";

  /**
   * A counter shows its number as text, not as an input.
   *
   * Sizing an input to fit Arabic-Indic digits cannot be done in `ch`: that unit
   * is the width of the Latin `0`, and «٠» is a narrow dot where «٣» is wide, so
   * a one-`ch` slot cut the three in half (Khaled, 2026-08-23). Every other unit
   * is the same guess with different arithmetic.
   *
   * Text has no such problem — it is exactly as wide as the glyph it is drawing,
   * which is also what the design measures (Figma 3906:13771). Nothing is lost
   * by dropping the input: a counter is tapped, never typed, and it was already
   * capped at what is left of the flock.
   */
  const number = toArabicDigits(value);

  return (
    // Plus first: in this RTL app the first child lands on the right, and the
    // design puts the "+" on the right of the number and the "−" on the left.
    <div
      className="flex items-center justify-center"
      style={{ gap: `${gapPx}px` }}
    >
      <StepButton
        sign="plus"
        label={`زيادة ${label}`}
        onClick={() => set(value + step)}
      />
      {isCounter ? (
        <span
          // Announced when it changes, since the number is no longer a control
          // a screen reader would read back on its own.
          role="status"
          aria-live="polite"
          className="text-center text-h2 font-bold text-foreground"
        >
          {number}
        </span>
      ) : (
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
          value={value > 0 ? toArabicDigits(value) : ""}
          onChange={(e) => {
            const typed = toLatinDigits(e.target.value);
            if (typed === "") onChange(min);
            else set(Number(typed));
          }}
          size={digits}
          className="min-w-[2ch] bg-transparent text-center text-h2 font-bold text-foreground outline-none placeholder:text-disabled-soft"
        />
      )}
      <StepButton
        sign="minus"
        label={`تقليل ${label}`}
        onClick={() => onChange(clamp(value - step))}
      />
    </div>
  );
}
