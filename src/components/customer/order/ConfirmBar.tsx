"use client";

import { Button } from "@/components/ui";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { formatWeight, pluralizeChicken } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChickenTray } from "./ChickenTray";

/**
 * The confirm bar (C-22, Figma 3155:4389) — what the order says, then the button
 * that sends it.
 *
 * It reads the order back before it is sent: the count in words, the weight, and
 * the tray again, small. That repetition is the point. This customer scrolled
 * past the counter three sections ago and is about to commit; the alternative is
 * a confirmation dialog, which is a second screen for the same reassurance and
 * one more tap for someone who does not want any.
 *
 * ## When it is on screen
 *
 * Two conditions, both from Khaled (2026-08-23):
 *
 * **It does not wait for an order to be filled in** (Khaled, 2026-08-24). A
 * button that is there and says what is missing beats one that appears only once
 * nothing is missing: the second kind leaves a customer who has picked nothing
 * looking for the way forward on a screen that has hidden it.
 *
 * What it does wait for is a scroll. The screen opens without it — C-20 is drawn
 * that way and a bar over the foot of a page nobody has read yet is just cover —
 * and it arrives on the first move down the form. Scrolling back up is going to
 * change something, so it gets out of the way of what he is returning to; coming
 * down again brings it back. That is why the design names the state
 * «ConfirmVisible» rather than drawing the bar into C-20.
 *
 * Fixed above the bottom nav rather than sticky in the flow: it has to be
 * reachable from anywhere on a long form, not only once the form is scrolled to
 * its end. It sits under the pickup panels in the layer order — a panel opened
 * near the foot of the screen must not end up behind it.
 */

/** Height of the customer's bottom nav, which this sits directly on top of. */
const NAV_HEIGHT = 76;

export function ConfirmBar({
  count,
  weight,
  onConfirm,
  disabled,
  isSending,
}: {
  count: number;
  /** The chosen approximate weight (kg), or null before one is picked. */
  weight: number | null;
  onConfirm: () => void;
  disabled: boolean;
  isSending: boolean;
}) {
  const direction = useScrollDirection();
  const shown = direction === "down";

  return (
    <div
      // Kept mounted and slid away, not unmounted: a bar that pops into
      // existence under a thumb is a bar that gets tapped by accident.
      aria-hidden={!shown}
      style={{ bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))` }}
      className={cn(
        "fixed inset-x-0 z-20 mx-auto flex w-full max-w-[430px] flex-col items-center gap-3 bg-white px-screen py-2",
        "transition-[transform,opacity] duration-200",
        shown
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <div className="flex w-full items-center justify-end gap-3">
        <div className="flex flex-1 flex-wrap items-center justify-end gap-x-2.5 gap-y-1 text-right text-foreground">
          <span className="whitespace-nowrap">
            <span className="text-base font-bold">عدد : </span>
            <span className="text-lg">{pluralizeChicken(count)}</span>
          </span>
          {weight != null && (
            <span className="whitespace-nowrap">
              <span className="text-base font-bold">الوزن : </span>
              <span className="text-sm">في حدود {formatWeight(weight)}</span>
            </span>
          )}
        </div>

        <ChickenTray count={count} className="w-[59px]" />
      </div>

      <Button onClick={onConfirm} disabled={disabled} isLoading={isSending}>
        تأكيد الطلب
      </Button>
    </div>
  );
}
