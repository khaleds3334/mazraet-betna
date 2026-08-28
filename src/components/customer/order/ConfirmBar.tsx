"use client";

import { createPortal } from "react-dom";
import { Button } from "@/components/ui";
import { NAV_SLOT_ID } from "@/components/layout/BottomNav";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";
import { ConfirmSummary } from "./ConfirmSummary";

/**
 * The confirm bar (C-22, Figma 3155:4389) — what the order says, then the button
 * that sends it.
 *
 * It reads the order back before it is sent — see `ConfirmSummary` for what it
 * says and why. This file owns where it sits and how it arrives.
 *
 * ## Where it lives
 *
 * **Inside the bottom nav, not above it** (Khaled, 2026-08-25) — rendered
 * through `NAV_SLOT_ID`, so the two are one white surface under one top border
 * rather than two panels with a seam between them. Figma draws them as two
 * (C-22, 3155:4402); this is a deliberate step past the design, and stepping
 * back is a matter of rendering the same markup in place instead of portalling.
 *
 * A portal because the state is in the wrong direction: the nav is mounted by
 * the customer layout and the order lives in the page underneath it, so there is
 * no prop that could carry the count upwards.
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
 * ## How it comes and goes
 *
 * The nav grows. `grid-rows-[0fr] → [1fr]` over a clipped row is the one way to
 * animate to a height nobody has measured; because the nav is pinned to the
 * bottom of the screen, the height it gains pushes its own top edge — and its
 * border — upward. So the bar is not something that arrives over the nav, it is
 * the nav unfolding.
 *
 * Arriving is slower than leaving, and overshoots a little on the way: an
 * announcement is worth watching, a dismissal is not.
 *
 * What it says settles a beat behind the surface it says it on. That delay is
 * the whole trick — the eye lands on the bar first and finds the order already
 * written in it.
 */

/** Arriving overshoots a touch and takes its time; leaving does neither. */
const ENTER = "duration-300 ease-[cubic-bezier(0.22,1.15,0.36,1)]";
const LEAVE = "duration-200 ease-[cubic-bezier(0.4,0,1,1)]";

export function ConfirmBar({
  count,
  weight,
  salePrice,
  cleaning,
  cleaningPrice,
  onConfirm,
  blocked,
  onBlockedTap,
  isSending,
}: {
  count: number;
  /** The chosen approximate weight (kg), or null before one is picked. */
  weight: number | null;
  salePrice: number;
  cleaning: boolean;
  cleaningPrice: number;
  onConfirm: () => void;
  /** Nothing can be ordered right now — sold out, or the sale is shut. */
  blocked: boolean;
  /** Called instead of `onConfirm` while blocked: says why, again. */
  onBlockedTap: () => void;
  isSending: boolean;
}) {
  const direction = useScrollDirection();
  const hydrated = useIsHydrated();
  const shown = direction === "down";

  // The slot is looked up rather than held in state, the same way `Modal` and
  // `BottomSheet` reach `document.body`: there is nothing to subscribe to, the
  // nav is mounted by the layout above this page, and a portal with no target
  // throws. `useIsHydrated` is what keeps the server out of it.
  const slot = hydrated ? document.getElementById(NAV_SLOT_ID) : null;
  if (!slot) return null;

  return createPortal(
    <div
      // Kept mounted and folded away, not unmounted: a button that pops into
      // existence under a thumb is a button that gets tapped by accident.
      // `inert` takes it out of the tab order and off the screen reader while
      // it is folded — `overflow-hidden` only hides it from the eye.
      inert={!shown}
      className={cn(
        "grid w-full overflow-hidden",
        "transition-[grid-template-rows] motion-reduce:transition-none",
        shown ? `grid-rows-[1fr] ${ENTER}` : `grid-rows-[0fr] ${LEAVE}`,
      )}
    >
      {/* `min-h-0` — without it the row refuses to shrink under its content and
          the fraction never reaches zero. */}
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "flex flex-col items-center gap-3 pb-4",
            "transition-opacity motion-reduce:transition-none",
            shown ? `opacity-100 ${ENTER}` : `opacity-0 ${LEAVE}`,
          )}
        >
          <div
            className={cn(
              "w-full transition-transform motion-reduce:transition-none",
              shown ? `scale-100 delay-100 ${ENTER}` : `scale-95 ${LEAVE}`,
            )}
          >
            <ConfirmSummary
              count={count}
              weight={weight}
              salePrice={salePrice}
              cleaning={cleaning}
              cleaningPrice={cleaningPrice}
            />
          </div>

          {/* `aria-disabled`, never `disabled` — a blocked button here has to
              stay tappable. The reason it is blocked is said in a toast when the
              screen opens, and a toast leaves; a truly disabled button would
              then be a dead control with no way left to ask it why. So it looks
              unavailable, and answers when pressed (Khaled, 2026-08-28).

              The dimming is written here rather than left to Button's own
              `disabled:opacity-60`, which cannot fire without the real
              attribute. */}
          <Button
            onClick={blocked ? onBlockedTap : onConfirm}
            aria-disabled={blocked || undefined}
            className={cn(blocked && "opacity-60")}
            isLoading={isSending}
          >
            تأكيد الطلب
          </Button>
        </div>
      </div>
    </div>,
    slot,
  );
}
