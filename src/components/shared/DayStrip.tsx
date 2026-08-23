"use client";

import { formatArabicDate, formatArabicNumber } from "@/lib/format";
import { farmToday } from "@/lib/pickupSlots";
import { cn } from "@/lib/utils";

/**
 * The day strip (Figma 3155:4275) — a scrollable row of small cards, each a
 * ringed day number over its name, earliest first.
 *
 * In `shared` because it is a way of asking "which day", not something about
 * ordering: the admin will want the same strip (Khaled, 2026-08-23).
 *
 * It replaces the phone's own date picker on purpose. A calendar shows every day
 * of the year and only a handful can actually be booked; this shows the days the
 * caller allows and nothing else, so there is no way to pick a day and be told
 * no. The first two read «اليوم» and «غدا» rather than their weekday names,
 * which is how someone says them out loud.
 *
 * The strip fills whatever it is given and scrolls sideways inside it — the
 * caller decides whether that is a column or the whole width of the phone.
 */
export function DayStrip({
  id,
  days,
  selected,
  onSelect,
}: {
  id?: string;
  /** The bookable days, `YYYY-MM-DD`, earliest first. */
  days: string[];
  selected: string;
  onSelect: (date: string) => void;
}) {
  const today = farmToday();

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label="يوم الاستلام"
      // The two inset shadows are the design's own: they fade the chips into the
      // panel at both ends, so a half-scrolled row reads as continuing rather
      // than as cut off.
      className={cn(
        "no-scrollbar overflow-x-auto rounded-md bg-surface-page py-[11px]",
        "shadow-[var(--shadow-panel),inset_-16px_0_8px_0_var(--color-surface-page),inset_16px_0_8px_0_var(--color-surface-page)]",
      )}
    >
      <div className="flex w-max gap-1 px-3">
        {days.map((date) => {
          const isSelected = date === selected;
          return (
            <button
              key={date}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(date)}
              className={cn(
                "flex w-[56px] shrink-0 flex-col items-center gap-px rounded-xl border px-2 py-3 text-xs text-foreground transition-colors",
                isSelected
                  ? "border-primary-hover bg-primary"
                  : "border-border bg-surface-page",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-[3px]",
                  isSelected ? "border-primary-hover" : "border-border",
                )}
              >
                {formatArabicNumber(new Date(date).getDate())}
              </span>
              <span className="whitespace-nowrap">{dayName(date, today)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** «اليوم» · «غدا» · then the weekday, which is how the day gets said out loud. */
function dayName(date: string, today: string): string {
  if (date === today) return "اليوم";

  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (date === tomorrow.toISOString().slice(0, 10)) return "غدا";

  return formatArabicDate(date, "EEEE");
}
