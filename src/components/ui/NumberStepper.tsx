import { toArabicDigits, toLatinDigits } from "@/lib/format";
import { AddButton } from "./AddButton";

/**
 * An underlined whole-number field with an `AddButton` (Figma count/price
 * inputs, e.g. A-41). The value shows in Arabic-Indic digits (FR-3); typing
 * accepts either digit set. `suffix` renders a unit after the number (e.g.
 * "جنية"). `step` sets how much the "+" button adds each tap — default 1, pass a
 * larger step for fields usually adjusted in bulk (e.g. 50 for a chick count).
 */
export function NumberStepper({
  value,
  onChange,
  label,
  suffix,
  step = 1,
  tone = "default",
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  suffix?: string;
  step?: number;
  /** "danger" recolours the underline + digits red (A-14 mortality field). */
  tone?: "default" | "danger";
}) {
  const text = tone === "danger" ? "text-error" : "text-foreground";
  const underline = tone === "danger" ? "border-error" : "border-foreground";
  return (
    // Field first, button second in source: in this RTL app the first child
    // lands on the right (same convention as BottomNav) — matches the design,
    // where the underlined field sits right of the "+" (node 3264:2480).
    <div className="flex items-center gap-4">
      <AddButton
        label={`زيادة ${label}`}
        onClick={() => onChange(value + step)}
      />
      <div className={`flex min-w-[64px] items-center justify-center gap-1 border-b-[3px] py-2 ${underline}`}>
        <input
          inputMode="numeric"
          aria-label={label}
          placeholder="٠"
          size={Math.max(1, String(value || "٠").length)}
          value={value > 0 ? toArabicDigits(value) : ""}
          onChange={(e) => {
            const d = toLatinDigits(e.target.value);
            onChange(d === "" ? 0 : Number(d));
          }}
          className={`grow-0 bg-transparent text-center text-h5 font-bold outline-none placeholder:text-disabled-soft ${text}`}
        />
        {suffix && (
          <span className={`shrink-0 text-h5 font-bold ${text}`}>{suffix}</span>
        )}
      </div>
    </div>
  );
}
