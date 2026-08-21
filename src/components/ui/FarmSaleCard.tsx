"use client";

import { Toggle } from "./Toggle";
import { cn } from "@/lib/utils";

/**
 * «حالة البيع للمزرعة» — the warm card at the top of settings (Figma 3322:17111):
 * the switch on one side, the heading and a line of explanation on the other.
 *
 * The switch only ever closes and re-opens the sale on a cycle that is already
 * selling. It does not start or end a selling phase — that is the cycle's own
 * button — so with no cycle selling there is nothing for it to act on and it is
 * disabled, with `hint` saying why. Closing the sale here stops customers
 * ordering and flips their home to «البيع مقفول» without touching the cycle.
 *
 * `onChange` is optional: without it the card is a read-only status, which is
 * the shape the customer app needs.
 */
export function FarmSaleCard({
  open,
  hint,
  onChange,
  disabled = false,
  className,
}: {
  open: boolean;
  /** The line under the heading — why it is disabled, or what closing does. */
  hint: string;
  onChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-[5px] bg-surface-notice px-3 py-2",
        "shadow-[0px_0px_3px_0px_rgba(63,98,70,0.08)]",
        // A disabled switch still has to be readable — it is the thing telling
        // the admin the farm is not selling.
        disabled && "opacity-70",
        className,
      )}
    >
      {/* Text first: in RTL the first child lands on the right, which is where
          the design puts the heading. */}
      <div className="min-w-0 text-right text-foreground">
        <p className="text-h6 font-bold">حالة البيع للمزرعة</p>
        <p className="mt-1 text-base">{hint}</p>
      </div>

      {onChange && (
        <Toggle
          checked={open}
          onChange={onChange}
          disabled={disabled}
          label="فتح وقفل البيع"
        />
      )}
    </div>
  );
}
