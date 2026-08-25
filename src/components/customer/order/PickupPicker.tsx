"use client";

import { useRef, useState } from "react";
import { NAV_ID } from "@/components/layout/BottomNav";
import { DAY_STRIP_HEIGHT, DayStrip } from "@/components/shared/DayStrip";
import { SlotList, slotListHeight } from "@/components/shared/SlotList";
import { formatArabicDate } from "@/lib/format";
import { bookableSlots, pickupSlotLabel, type PickupSlot } from "@/lib/pickupSlots";
import { cn } from "@/lib/utils";
import { PickupField } from "./PickupField";

/**
 * «عاوز الفراخ امتي؟» — the day and the slot together (C-20 → C-23 → C-24).
 *
 * They are one component because they are one answer, and because the day
 * decides the slots: pick today after Asr and the morning is gone; pick tomorrow
 * and it is back. The slot is cleared when that happens rather than silently
 * left pointing at a time the new day no longer offers — the customer would
 * never see it change, and it is the field he is least likely to re-read.
 *
 * **The two panels are anchored differently, because the design draws them so.**
 * The day strip runs the full width of the phone (Figma has it at x=0, 393
 * wide), so it hangs off the fields *row* and breaks out of the section's
 * gutter. The slot list is exactly as wide as the field it drops from (163px,
 * the same x as `SelectInput`), so it hangs off that field's own column.
 *
 * **Both float over what follows rather than pushing it down** (Khaled,
 * 2026-08-25) — they are panels, not sections. The day strip used to be a
 * section in the flow, which meant opening it shoved the note, the warning and
 * everything under them a strip's height down the page, under a thumb that was
 * reaching for a day.
 *
 * One panel at a time. Both open at once covers the fields themselves, and the
 * two choices are made one after the other anyway.
 *
 * **Either panel opens upwards when it would not fit downwards** (Khaled,
 * 2026-08-25). Floating is what makes that necessary: a panel that fits nowhere
 * below comes out underneath the bottom nav and is read by nobody. Which way it
 * goes is decided on the tap, from the room actually left — see `roomBelow`.
 */

/** The gap a panel drops by, `mt-2` / `mt-3` in the markup below. */
const SLOT_DROP = 8;
const DAY_DROP = 12;

/**
 * Whether a panel `needs` pixels tall fits between `anchor` and the bottom nav.
 *
 * Asked with the height the panel will *actually* be, not the tallest it could
 * ever be: two slots do not need the room six do, and demanding the maximum is
 * how a panel that had plenty of room opened upwards anyway (Khaled,
 * 2026-08-25).
 *
 * The nav is measured rather than assumed: it is one height on this screen, a
 * taller one while the confirm bar is unfolded into it, and taller again on the
 * tracking section. Assuming the short one is how a panel ends up half-hidden
 * behind the tall one.
 */
function roomBelow(anchor: HTMLElement | null, needs: number): boolean {
  if (!anchor) return true;
  const nav = document.getElementById(NAV_ID);
  const floor = nav?.getBoundingClientRect().top ?? window.innerHeight;
  return floor - anchor.getBoundingClientRect().bottom >= needs;
}

export function PickupPicker({
  days,
  slots,
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  /** The bookable days, `YYYY-MM-DD`, earliest first. */
  days: string[];
  /** Every slot the farm offers — this component drops the ones that passed. */
  slots: PickupSlot[];
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}) {
  const [panel, setPanel] = useState<"day" | "time" | null>(null);
  // Which way each panel went, decided when it opened and held while it is open
  // — a panel that changes sides under a reading thumb is worse than one on the
  // wrong side.
  const [above, setAbove] = useState(false);
  const fieldsRow = useRef<HTMLDivElement>(null);
  const timeColumn = useRef<HTMLDivElement>(null);

  const open = date ? bookableSlots(slots, date) : slots;

  function openDay() {
    setAbove(!roomBelow(fieldsRow.current, DAY_STRIP_HEIGHT + DAY_DROP));
    setPanel("day");
  }

  function openTime() {
    const needs = slotListHeight(open.length) + SLOT_DROP;
    setAbove(!roomBelow(timeColumn.current, needs));
    setPanel("time");
  }

  function chooseDay(next: string) {
    onDateChange(next);
    // The slot belonged to the old day. Keep it only if the new day still has it.
    if (time && !bookableSlots(slots, next).some((s) => s.time === time)) {
      onTimeChange("");
    }
    // Straight on to the second half of the same question. The fields do not
    // move when the day strip below them closes, so this measures the same
    // positions the next paint will have.
    openTime();
  }

  return (
    <div className="flex flex-col gap-3 bg-white px-screen py-4">
      <p className="text-right text-h5 text-primary-foreground">
        عاوز الفراخ امتي؟
      </p>

      <div ref={fieldsRow} className="relative flex items-start gap-5">
        <PickupField
          label="اختار اليوم"
          placeholder="اختار التاريخ"
          value={date ? formatArabicDate(date, "EEEE d MMMM") : ""}
          icon="dateTime"
          open={panel === "day"}
          onToggle={() => (panel === "day" ? setPanel(null) : openDay())}
          controls="pickup-days"
        />

        {/* The slot panel belongs to this column, so it is positioned in it. */}
        <div ref={timeColumn} className="relative min-w-0 flex-1">
          <PickupField
            label="اختار الوقت"
            placeholder="اختر موعد"
            // Looked up in every slot, not just the ones still open: a slot
            // chosen before its time passed must keep its name on the field
            // rather than falling back to a clock reading.
            value={pickupSlotLabel(slots, time || null) ?? ""}
            icon="arrowDown"
            open={panel === "time"}
            onToggle={() => (panel === "time" ? setPanel(null) : openTime())}
            controls="pickup-slots"
          />

          {panel === "time" && (
            <div
              className={cn(
                "absolute inset-x-0 z-30",
                above ? "bottom-full mb-2" : "top-full mt-2",
              )}
            >
              <SlotList
                id="pickup-slots"
                slots={open}
                selected={time}
                emptyMessage={
                  date
                    ? "مواعيد النهاردة خلصت — اختار يوم تاني."
                    : "اختار اليوم الأول."
                }
                onSelect={(slot) => {
                  onTimeChange(slot.time);
                  setPanel(null);
                }}
              />
            </div>
          )}
        </div>

        {/* Hung off the row, not off the day field: the strip runs the full
            width of the phone, and `bleed-screen-flush` walks it back out
            through the section's gutter to get there. */}
        {panel === "day" && (
          <div
            className={cn(
              "bleed-screen-flush absolute inset-x-0 z-30",
              above ? "bottom-full mb-3" : "top-full mt-3",
            )}
          >
            <DayStrip
              id="pickup-days"
              days={days}
              selected={date}
              onSelect={chooseDay}
            />
          </div>
        )}
      </div>
    </div>
  );
}
