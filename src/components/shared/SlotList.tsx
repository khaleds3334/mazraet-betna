"use client";

import type { PickupSlot } from "@/lib/pickupSlots";
import { cn } from "@/lib/utils";

/**
 * The pickup-time panel (Figma 3155:4717) — the slots listed under the field
 * that opened it, at that field's width (Khaled, 2026-08-23). Sizing is the
 * caller's job; this fills whatever box it is put in.
 *
 * In `shared` for the same reason as `DayStrip`: asking "which time" is not
 * something only the customer does.
 *
 * **It scrolls, and the lime rail is a real scrollbar.** The design draws six
 * slots in a box that holds about four and a half, with a 6px lime bar down the
 * inline-start edge — so the bar is the scrollbar, not decoration, and the panel
 * has to actually scroll for it to be honest. `lime-scrollbar` styles it and, by
 * styling it at all, stops Chrome hiding it until the list is touched: the whole
 * point is that «قبل المغرب» announces itself before anyone goes looking.
 *
 * Slots that have already gone by today are dropped by the caller rather than
 * greyed out here — at six in the evening the morning is not a choice that needs
 * refusing, it is simply not today's.
 */
const PANEL_MAX_HEIGHT = 170;

/** The box's own `py-4`, the `gap-4` between slots, and one slot's line of text. */
const PANEL_PADDING = 32;
const SLOT_GAP = 16;
const SLOT_HEIGHT = 15; // text-xs at the app's 1.2 line-height

/**
 * How tall this will be with `slots` slots in it, so a caller can tell whether
 * it has room to drop the panel below the field that opened it.
 *
 * The arithmetic lives here rather than in the caller because the numbers are
 * this component's own: change the padding or the gap and the answer changes
 * with it, in the same file. Three slots do not need the room six do — asking
 * for the maximum every time is how a panel that would have fitted opens
 * upwards anyway (Khaled, 2026-08-25).
 */
export function slotListHeight(slots: number): number {
  if (slots <= 0) return PANEL_PADDING + SLOT_HEIGHT; // the empty line
  const content = slots * SLOT_HEIGHT + (slots - 1) * SLOT_GAP;
  return Math.min(PANEL_PADDING + content, PANEL_MAX_HEIGHT);
}

export function SlotList({
  id,
  slots,
  selected,
  onSelect,
  emptyMessage,
}: {
  id?: string;
  slots: PickupSlot[];
  /** The chosen slot's `HH:mm`, or "" for none. */
  selected: string;
  onSelect: (slot: PickupSlot) => void;
  /** Shown when every slot for the chosen day has passed. */
  emptyMessage: string;
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label="وقت الاستلام"
      style={{ maxHeight: PANEL_MAX_HEIGHT }}
      // The bottom fade is the design's, and it says the same thing the rail
      // does: there is more below this line.
      className={cn(
        "lime-scrollbar overflow-y-auto overscroll-contain rounded-xl bg-surface-page py-4 pr-4",
        "shadow-[var(--shadow-panel),inset_0_-16px_10px_0_rgb(255_255_255_/_0.8)]",
      )}
    >
      {slots.length === 0 ? (
        <p className="text-right text-xs text-muted">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col items-start gap-4">
          {slots.map((slot) => {
            const isSelected = slot.time === selected;
            return (
              <button
                key={slot.time}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(slot)}
                className={cn(
                  "text-right text-xs whitespace-nowrap text-foreground",
                  isSelected && "font-bold text-primary-foreground",
                )}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
