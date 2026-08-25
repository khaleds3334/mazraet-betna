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

/**
 * The weight the form opens on for a customer with no history (Khaled,
 * 2026-08-25) — the middle of what the farm sells and the one most people ask
 * for. If the farm has stopped offering it, the nearest weight it does offer
 * stands in; the form must never open on a weight that is not on the row.
 */
const FALLBACK_WEIGHT = 2;

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
  /**
   * How many birds the counter opens on, and at which weight (Khaled,
   * 2026-08-25).
   *
   * Both come from the customer's own last order when he has one: most people
   * here buy the same thing every time, so the form that opens already filled in
   * is the form he can send without answering anything. When he has never
   * ordered, the counter opens empty and the weight on `FALLBACK_WEIGHT`.
   *
   * Both are checked against what the farm has *now* — see `lastOrderChoices`.
   */
  defaultCount: number;
  defaultWeight: number | null;
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

/** What the customer asked for last time — the count and the weight, as ordered. */
interface LastOrder {
  count: number;
  weight: number | null;
}

/**
 * The customer's most recent order, as choices rather than as an order.
 *
 * Cancelled ones are skipped: an order that was called off is the least likely
 * thing he wants repeated, and often the reason it was called off is that it was
 * wrong. Everything else counts, including one still on the farm — a second
 * order the same week is usually the same order.
 *
 * The count is the number of lines, because one line is one bird (D-13), and the
 * weight is the one they were all asked at.
 */
async function lastOrderChoices(customerId: string): Promise<LastOrder | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_line(approx_weight)")
    .eq("customer_id", customerId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lines = data?.order_line ?? [];
  if (lines.length === 0) return null;
  return { count: lines.length, weight: lines[0].approx_weight };
}

/** The nearest weight the farm actually offers to `wanted`, or null if it offers none. */
function nearestWeight(weights: number[], wanted: number): number | null {
  if (weights.length === 0) return null;
  return weights.reduce((best, weight) =>
    Math.abs(weight - wanted) < Math.abs(best - wanted) ? weight : best,
  );
}

export async function getOrderForm(
  farmId: string,
  /** Who is ordering, so the form can open on what he ordered last. */
  customerId?: string,
): Promise<OrderForm> {
  const [settings, sale, available, last] = await Promise.all([
    getFarmSettings(farmId),
    getActiveSaleState(farmId),
    countAvailableForCustomer(farmId),
    customerId ? lastOrderChoices(customerId) : null,
  ]);

  const now = new Date();
  const close = sale?.targetDate ? new Date(sale.targetDate) : null;
  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + DEFAULT_PICKUP_DAYS);

  // A close date already behind us leaves no days at all, and a strip with
  // nothing on it reads as a broken screen rather than a shut sale. Today is
  // always offered; whether the sale takes the order is `saleOpen`'s answer.
  const lastDay = close && close.getTime() > now.getTime() ? close : fallback;

  // Both ends read on the farm's clock, not the server's. This runs on a machine
  // set to UTC, so between midnight and 2am in the village `new Date()` is still
  // on yesterday's date — and the strip would have opened on a day that had
  // already gone (see `farmToday`).
  const days = daysBetween(farmToday(now), farmToday(lastDay));
  const opening = defaultPickup(days, settings.pickupSlots);

  // Ascending, so in RTL the lightest bird sits on the right where the row
  // starts reading (C-20, Khaled 2026-08-23) — the same order settings stores
  // them in and the same order its own «الاوزان المتوفرة» row shows.
  const weights = [...settings.availableWeights].sort((a, b) => a - b);

  return {
    saleOpen: sale?.saleOpen ?? false,
    available,
    salePrice: settings.salePrice,
    cleaningPrice: settings.cleaningPrice,
    defaultCleaning: settings.defaultCleaning,
    // Never more than the farm has left: the counter refuses to go past
    // `available`, and a form that opens above its own ceiling is a form whose
    // «+» is dead on arrival.
    defaultCount: Math.min(last?.count ?? 0, available),
    defaultWeight: nearestWeight(weights, last?.weight ?? FALLBACK_WEIGHT),
    weights,
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
