"use client";

import { Toggle } from "./Toggle";
import { cn } from "@/lib/utils";

/**
 * A warm card carrying one switch and the two lines that explain it: a bold
 * question on top, a quieter line under it, and the switch on the far side.
 *
 * The design uses this same card for two unrelated switches — «حالة البيع
 * للمزرعة» at the top of settings (Figma 3322:17111) and «الذبح و التنظيف؟» on
 * the customer's order screen (2953:1602) — so the shape lives here once and
 * each screen says what its own switch means (Khaled, 2026-08-23).
 *
 * **The text comes first in the DOM.** In RTL that puts it on the right and the
 * switch on the left, which is where the design has them. Writing the switch
 * first mirrors the card, which is exactly what had happened to the cleaning one
 * before the two were compared side by side.
 *
 * `onChange` is optional: without it the card is a read-only status, which is
 * the shape the customer's home needs.
 */
export function ToggleCard({
  title,
  hint,
  checked,
  onChange,
  toggleLabel,
  disabled = false,
  className,
}: {
  /** The bold question or heading. */
  title: string;
  /** The quieter line under it — a price, or why the switch is inert. */
  hint: string;
  checked: boolean;
  onChange?: (next: boolean) => void;
  /** What a screen reader calls the switch — the card's title is not it. */
  toggleLabel: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[54px] items-center justify-between gap-3 rounded-[5px] bg-surface-notice px-3 py-2 shadow-soft",
        // A disabled switch still has to be readable — it is often the thing
        // telling the user why nothing can be done here.
        disabled && "opacity-70",
        className,
      )}
    >
      <div className="min-w-0 text-right text-foreground">
        <p className="text-h6 font-bold">{title}</p>
        <p className="mt-1 text-base">{hint}</p>
      </div>

      {onChange && (
        <Toggle
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          label={toggleLabel}
        />
      )}
    </div>
  );
}
