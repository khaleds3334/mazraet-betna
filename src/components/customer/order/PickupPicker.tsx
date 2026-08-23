"use client";

import { useState } from "react";
import { DayStrip } from "@/components/shared/DayStrip";
import { SlotList } from "@/components/shared/SlotList";
import { formatArabicDate } from "@/lib/format";
import { bookableSlots, pickupSlotLabel, type PickupSlot } from "@/lib/pickupSlots";
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
 * wide), so it breaks out of the section's gutter. The slot list is exactly as
 * wide as the field it drops from (163px, the same x as `SelectInput`), so it is
 * absolutely positioned inside that field's own column.
 *
 * Both float over what follows rather than pushing it down — they are panels,
 * not sections, and the confirm bar below must not jump when one opens.
 *
 * One panel at a time. Both open at once pushes everything off a short screen,
 * and the two choices are made one after the other anyway.
 */
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

  const open = date ? bookableSlots(slots, date) : slots;

  function chooseDay(next: string) {
    onDateChange(next);
    // The slot belonged to the old day. Keep it only if the new day still has it.
    if (time && !bookableSlots(slots, next).some((s) => s.time === time)) {
      onTimeChange("");
    }
    // Straight on to the second half of the same question.
    setPanel("time");
  }

  return (
    <div className="flex flex-col gap-3 bg-white px-screen py-4">
      <p className="text-right text-h5 text-primary-foreground">
        عاوز الفراخ امتي؟
      </p>

      <div className="flex items-start gap-5">
        <PickupField
          label="اختار اليوم"
          placeholder="اختار التاريخ"
          value={date ? formatArabicDate(date, "EEEE d MMMM") : ""}
          icon="dateTime"
          open={panel === "day"}
          onToggle={() => setPanel(panel === "day" ? null : "day")}
          controls="pickup-days"
        />

        {/* The slot panel belongs to this column, so it is positioned in it. */}
        <div className="relative min-w-0 flex-1">
          <PickupField
            label="اختار الوقت"
            placeholder="اختر موعد"
            // Looked up in every slot, not just the ones still open: a slot
            // chosen before its time passed must keep its name on the field
            // rather than falling back to a clock reading.
            value={pickupSlotLabel(slots, time || null) ?? ""}
            icon="arrowDown"
            open={panel === "time"}
            onToggle={() => setPanel(panel === "time" ? null : "time")}
            controls="pickup-slots"
          />

          {panel === "time" && (
            <div className="absolute inset-x-0 top-full z-30 mt-2">
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
      </div>

      {/* Full width of the phone, out past the section's gutter. */}
      {panel === "day" && (
        <div className="bleed-screen-flush relative z-30">
          <DayStrip
            id="pickup-days"
            days={days}
            selected={date}
            onSelect={chooseDay}
          />
        </div>
      )}
    </div>
  );
}
