import { parseDecimal, toArabicDigits, toLatinDigits } from "@/lib/format";
import { StepButton } from "./StepButton";

/**
 * An underlined number field with a "+" `StepButton` (Figma count/price inputs,
 * e.g. A-41). The value shows in Arabic-Indic digits (FR-3); typing accepts
 * either digit set. `suffix` renders a unit after the number (e.g. "جنية").
 *
 * `step` sets how much the "+" adds each tap — default 1, larger for fields
 * adjusted in bulk (50 for a chick count). **A fractional step makes the whole
 * field fractional:** `step={0.5}` lets the admin both tap his way to ١.٥ and
 * type it, and asks the phone for the keyboard that has a decimal point. Feed is
 * sold and opened by the half bag (Khaled, 2026-08-21).
 *
 * Holding the "+" repeats and accelerates — see `StepButton`.
 */
export function NumberStepper({
  value,
  onChange,
  label,
  suffix,
  step = 1,
  tone = "default",
  centerField = false,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  suffix?: string;
  step?: number;
  /** "danger" recolours the underline + digits red (A-14 mortality field). */
  tone?: "default" | "danger";
  /** Centre the *field itself* (not the field+button pair) by mirroring the
   *  button's width on the field's other side — used in the A-14 popup. */
  centerField?: boolean;
}) {
  const text = tone === "danger" ? "text-error" : "text-foreground";
  const underline = tone === "danger" ? "border-error" : "border-foreground";

  // Halves are only ever reachable when the step invites them.
  const fractional = !Number.isInteger(step);
  // Adding 0.5 repeatedly drifts in binary floating point; two decimals is well
  // past anything a bag count or a bag price is measured in.
  const clean = (n: number) => Math.round(n * 100) / 100;
  return (
    // Field first, button second in source: in this RTL app the first child
    // lands on the right (same convention as BottomNav) — matches the design,
    // where the underlined field sits right of the "+" (node 3264:2480).
    <div className="flex min-w-0 items-center justify-center gap-3">
      <StepButton
        label={`زيادة ${label}`}
        onClick={() => onChange(clean(value + step))}
      />
      <div
        className={`flex min-w-[48px] max-w-full items-center justify-center gap-1 border-b-[3px] py-2 ${underline}`}
      >
        <input
          inputMode={fractional ? "decimal" : "numeric"}
          aria-label={label}
          placeholder="٠"
          size={Math.max(1, String(value || "٠").length)}
          value={value > 0 ? toArabicDigits(value) : ""}
          onChange={(e) => {
            if (fractional) {
              // A half-typed "١." is not a number yet — hold the value rather
              // than snapping it back to ٠ under the thumb.
              const parsed = parseDecimal(e.target.value);
              onChange(parsed === null ? 0 : clean(parsed));
              return;
            }
            const d = toLatinDigits(e.target.value);
            onChange(d === "" ? 0 : Number(d));
          }}
          className={`min-w-0 grow-0 bg-transparent text-center text-h5 font-bold outline-none placeholder:text-disabled-soft ${text}`}
        />
        {suffix && (
          <span className={`shrink-0 text-h5 font-bold ${text}`}>{suffix}</span>
        )}
      </div>
      {/* Invisible twin of the "+" on the other side, so the field lands dead-centre. */}
      {centerField && <div aria-hidden className="size-11 shrink-0" />}
    </div>
  );
}
