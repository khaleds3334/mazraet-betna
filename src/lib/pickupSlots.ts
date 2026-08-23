/**
 * Pickup slots — the small amount of reasoning that both apps need about them,
 * kept out of the queries so a client component can import it too.
 *
 * A slot is a name and a clock value (migration 027). The customer picks the
 * name; the clock value is what lets the app sort the slots and work out that
 * one has already gone by. Neither half works alone: names cannot be compared,
 * and «١٦:٠٠» is not how these customers say a time of day.
 */
import { formatArabicTime } from "@/lib/format";

export interface PickupSlot {
  /** `HH:mm`. Ordering and "has it passed" only — never rendered. */
  time: string;
  /** What the customer reads: «قبل صلاة الظهر». */
  label: string;
}

/**
 * The farm's own clock.
 *
 * "Has this slot passed?" has to be answered on the wall clock in the village,
 * and half the code asking it runs on a server whose clock is UTC — two hours
 * behind, three in summer. Left to `new Date()` the server would have offered a
 * five-thirty pickup at seven in the evening, and the app and the action would
 * have disagreed about what day it was for two hours every night.
 *
 * `Intl` knows the offset and knows when it changes, so there is no table to
 * keep and nothing to get wrong twice a year.
 */
const FARM_TIME_ZONE = "Africa/Cairo";

const FARM_CLOCK = new Intl.DateTimeFormat("en-CA", {
  timeZone: FARM_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function farmClock(now: Date): { date: string; minutes: number } {
  const parts = Object.fromEntries(
    FARM_CLOCK.formatToParts(now).map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    // `hour12: false` renders midnight as "24" in some engines — fold it back.
    minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute),
  };
}

/** Today, on the farm's clock, as `YYYY-MM-DD`. */
export function farmToday(now: Date = new Date()): string {
  return farmClock(now).date;
}

/** Minutes since midnight, or -1 for anything that isn't `HH:mm`. */
function minutesOfDay(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return -1;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Narrow the `jsonb` column into slots, dropping anything malformed and sorting
 * by the clock. The column is `Json`, so this is the one place that has to look
 * at it closely — everything downstream gets `PickupSlot[]`.
 */
export function parsePickupSlots(value: unknown): PickupSlot[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (slot): slot is PickupSlot =>
        typeof slot === "object" &&
        slot !== null &&
        typeof (slot as PickupSlot).time === "string" &&
        typeof (slot as PickupSlot).label === "string",
    )
    .sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time));
}

/**
 * What to print for a stored `orders.pickup_time`.
 *
 * Falls back to the clock in Arabic digits when no slot matches — orders taken
 * before migration 027 hold times that are no longer offered, and an old order
 * saying «١:٠٠ م» is honest, where a blank or a guessed label would not be.
 */
export function pickupSlotLabel(
  slots: PickupSlot[],
  time: string | null,
): string | null {
  if (!time) return null;
  return slots.find((slot) => slot.time === time)?.label ?? formatArabicTime(time);
}

/**
 * The slots still bookable on `date`, given the moment `now`.
 *
 * Only today is filtered: a slot that has already passed today is gone, and
 * every slot of a later day is open. This is the whole reason a slot carries a
 * clock value at all — someone ordering at five in the afternoon should not be
 * offered this morning (Khaled, 2026-08-23).
 *
 * `date` is `YYYY-MM-DD` on the farm's own calendar, and so is the moment it is
 * compared against — see `farmClock`. Never the caller's local time: half of
 * these calls run on a server in another timezone.
 */
export function bookableSlots(
  slots: PickupSlot[],
  date: string,
  now: Date = new Date(),
): PickupSlot[] {
  const clock = farmClock(now);
  if (date !== clock.date) return slots;
  return slots.filter((slot) => minutesOfDay(slot.time) > clock.minutes);
}

/**
 * What the order form opens on: the soonest pickup the farm can actually make.
 *
 * Today and its next slot, normally. Order at night, once every slot has gone
 * by, and it rolls to tomorrow's first one (Khaled, 2026-08-23) — the customer
 * should never have to notice that the day he was shown is one he cannot be
 * served on.
 *
 * Walks the days in order rather than assuming tomorrow works: the last day of
 * the sale can be today, and a farm could in principle be given a set of slots
 * that leaves a day empty.
 *
 * Returns empty strings when no day on offer has a slot left — nothing can be
 * booked, and a default that cannot be honoured is worse than none.
 */
export function defaultPickup(
  days: string[],
  slots: PickupSlot[],
  now: Date = new Date(),
): { date: string; time: string } {
  for (const day of days) {
    const open = bookableSlots(slots, day, now);
    if (open.length > 0) return { date: day, time: open[0].time };
  }
  return { date: "", time: "" };
}
