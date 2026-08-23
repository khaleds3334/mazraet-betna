/**
 * Everything the customer's order screen (C-20→C-22) needs to draw itself, read
 * in one place: the prices, the weights and pickup slots on offer, how many birds
 * are left, and the last day the sale is open for.
 *
 * It is a customer-side read, which is why the bird count comes from an RPC
 * instead of a query. Counting through the customer's own session returns the
 * whole flock — RLS hides other people's orders and every mortality row, so the
 * subtractions come out at zero (T-58). `available_chickens` does the counting
 * with definer rights and hands back the one number (migration 027).
 */
import { createClient } from "@/lib/supabase/server";
import { getFarmSettings } from "@/lib/queries/settings";
import { getActiveSaleState } from "@/lib/queries/cycles";
import {
  defaultPickup,
  farmToday,
  type PickupSlot,
} from "@/lib/pickupSlots";

/** How far ahead the day strip reaches when the sale has no end date on it. */
const DEFAULT_PICKUP_DAYS = 7;

export interface OrderForm {
  /** Orders can be placed right now (FR-11, FR-25). */
  saleOpen: boolean;
  /** Birds still free to book. The counter stops here (Khaled, 2026-08-23). */
  available: number;
  /** Price of one kilo, quoted now and stamped on the order (T-15 as amended). */
  salePrice: number;
  /** What cleaning one bird costs. */
  cleaningPrice: number;
  /** Whether cleaning starts switched on. */
  defaultCleaning: boolean;
  /** The approximate weights on offer (kg), largest first as the design shows. */
  weights: number[];
  /** The pickup slots on offer, in clock order. */
  slots: PickupSlot[];
  /** The day the form opens on — today, or tomorrow if today is done (C-23). */
  defaultDate: string;
  /** The slot it opens on — the soonest one still bookable on `defaultDate`. */
  defaultTime: string;
  /**
   * The days the strip offers, `YYYY-MM-DD`, today first (C-23).
   *
   * It ends on the sale's own closing day: a customer must not book a pickup for
   * a day the farm has already stopped selling for (Khaled, 2026-08-23). When
   * nothing has dated the close, it runs a week out.
   */
  days: string[];
}

/** Birds free to sell on the farm's active cycle, counted with definer rights. */
export async function countAvailableForCustomer(
  farmId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("available_chickens", {
    _farm_id: farmId,
  });
  return typeof data === "number" ? data : 0;
}

export async function getOrderForm(farmId: string): Promise<OrderForm> {
  const [settings, sale, available] = await Promise.all([
    getFarmSettings(farmId),
    getActiveSaleState(farmId),
    countAvailableForCustomer(farmId),
  ]);

  const now = new Date();
  const close = sale?.targetDate ? new Date(sale.targetDate) : null;
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + DEFAULT_PICKUP_DAYS);

  // A close date already behind us leaves no days at all, and a strip with
  // nothing on it reads as a broken screen rather than a shut sale. Today is
  // always offered; whether the sale takes the order is `saleOpen`'s answer.
  const last = close && close.getTime() > now.getTime() ? close : fallback;

  // Both ends read on the farm's clock, not the server's. This runs on a machine
  // set to UTC, so between midnight and 2am in the village `new Date()` is still
  // on yesterday's date — and the strip would have opened on a day that had
  // already gone (see `farmToday`).
  const days = daysBetween(farmToday(now), farmToday(last));
  const opening = defaultPickup(days, settings.pickupSlots);

  return {
    saleOpen: sale?.saleOpen ?? false,
    available,
    salePrice: settings.salePrice,
    cleaningPrice: settings.cleaningPrice,
    defaultCleaning: settings.defaultCleaning,
    // Ascending, so in RTL the lightest bird sits on the right where the row
    // starts reading (C-20, Khaled 2026-08-23) — the same order settings stores
    // them in and the same order its own «الاوزان المتوفرة» row shows.
    weights: [...settings.availableWeights].sort((a, b) => a - b),
    slots: settings.pickupSlots,
    days,
    // Worked out here, on the server, so the form starts on the same value it
    // renders with — computing it in the client's `useState` would run once on
    // each side of hydration and could land on different sides of a slot's time.
    defaultDate: opening.date,
    defaultTime: opening.time,
  };
}

/**
 * Every day from `from` to `to` inclusive, as `YYYY-MM-DD`, earliest first.
 *
 * Walks dates, not instants: the cursor is anchored at midday UTC so adding a
 * day can never land back on the same date across a clock change.
 */
function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${from}T12:00:00Z`);

  // Bounded even if `to` is nonsense or behind `from` — a strip is a row the
  // customer scrolls, not a calendar.
  while (days.length < 60) {
    const day = cursor.toISOString().slice(0, 10);
    days.push(day);
    if (day >= to) break;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
