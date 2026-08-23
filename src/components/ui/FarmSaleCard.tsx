"use client";

import { ToggleCard } from "./ToggleCard";

/**
 * «حالة البيع للمزرعة» — the warm card at the top of settings (Figma 3322:17111).
 *
 * The switch only ever closes and re-opens the sale on a cycle that is already
 * selling. It does not start or end a selling phase — that is the cycle's own
 * button — so with no cycle selling there is nothing for it to act on and it is
 * disabled, with `hint` saying why. Closing the sale here stops customers
 * ordering and flips their home to «البيع مقفول» without touching the cycle.
 *
 * The card itself is `ToggleCard`, shared with the order screen's cleaning
 * switch; what belongs to this screen is the heading and the rule above.
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
    <ToggleCard
      title="حالة البيع للمزرعة"
      hint={hint}
      checked={open}
      onChange={onChange}
      toggleLabel="فتح وقفل البيع"
      disabled={disabled}
      className={className}
    />
  );
}
