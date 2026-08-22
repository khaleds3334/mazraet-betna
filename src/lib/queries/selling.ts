/**
 * Everything the selling dashboard (A-20) adds on top of the cycle itself: how
 * the flock has been split between sold / booked / still available, the money
 * side of the cycle, and how the orders are spread across the admin's three
 * tabs (FR-11, FR-12, FR-19, FR-20).
 */
import { createClient } from "@/lib/supabase/server";
import { availableChickens, averageChickenWeight } from "@/lib/calculations/cycle";
import { sumInvoices, type InvoiceTotals } from "@/lib/calculations/invoice";
import {
  ADMIN_ORDER_TABS,
  type AdminOrderTabKey,
  type OrderStatus,
} from "@/lib/constants";
import { tallyOrderTabs, type OrderTabCounts } from "@/lib/queries/orders";

export interface SellingStats {
  flock: {
    /** Birds free to sell right now. */
    available: number;
    /** Birds already handed over (delivered orders). */
    sold: number;
    /** Birds booked in orders that haven't been delivered yet. */
    requested: number;
  };
  money: InvoiceTotals & {
    /** Mean actual weight per bird across everything weighed so far (kg). */
    averageWeight: number;
  };
  /** Orders grouped the way the admin sees them — the three tabs of FR-12. */
  orders: OrderTabCounts;
}

/** Statuses per admin tab, derived from the single definition in constants. */
const statusesFor = (key: AdminOrderTabKey): OrderStatus[] =>
  ADMIN_ORDER_TABS.find((tab) => tab.key === key)?.statuses ?? [];

const RUNNING_STATUSES = [...statusesFor("new"), ...statusesFor("active")];
const DELIVERED_STATUSES = statusesFor("done");

/**
 * The selling-phase figures for one cycle. Reads every non-cancelled order of
 * the cycle once (with its lines and payments) and derives all of the tiles from
 * that single result — cancelled orders are excluded everywhere, since they hold
 * neither birds nor money.
 */
export async function getSellingStats(
  farmId: string,
  cycleId: string,
  flock: { chickCount: number; mortalityCount: number },
): Promise<SellingStats> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      "status, is_house, unit_price, cleaning_price, order_line(id, batch_no, position, actual_weight, cleaning), payment(amount)",
    )
    .eq("cycle_id", cycleId)
    .neq("status", "cancelled");
  const orders = data ?? [];

  const countLines = (statuses: OrderStatus[]): number =>
    orders
      .filter((order) => statuses.includes(order.status))
      .reduce((sum, order) => sum + (order.order_line?.length ?? 0), 0);

  const sold = countLines(DELIVERED_STATUSES);
  const requested = countLines(RUNNING_STATUSES);

  // Birds for the family house leave the flock like any other order — they are
  // counted in `sold`/`requested` above — but they are not a sale, so they carry
  // no revenue and no debt (FR-36). They are the only thing the money side drops.
  const money = sumInvoices(
    orders
      .filter((order) => !order.is_house)
      .map((order) => ({
        order,
        lines: order.order_line ?? [],
        payments: order.payment ?? [],
      })),
  );

  // Only birds that actually went on the scale count towards the average.
  const weights = orders
    .flatMap((order) => order.order_line ?? [])
    .map((line) => line.actual_weight)
    .filter((weight): weight is number => weight != null);

  return {
    flock: {
      available: availableChickens({
        chickCount: flock.chickCount,
        mortalityCount: flock.mortalityCount,
        soldCount: sold,
        requestedCount: requested,
      }),
      sold,
      requested,
    },
    money: { ...money, averageWeight: averageChickenWeight(weights) },
    // Cancelled orders were filtered out above and belong to no tab anyway.
    orders: tallyOrderTabs(orders),
  };
}

/**
 * Birds still free to sell on one cycle — the same figure the «الفراخ المتوفرة»
 * tile shows, read on its own because ending a cycle has to check it (D-49) and
 * that check should not pull the whole selling dashboard behind it.
 *
 * Deliberately the same inputs and the same `availableChickens` as the tile: a
 * second definition of "what is left of the flock" would eventually disagree with
 * the number on screen, and the admin would be refused for a reason the screen
 * does not show. It reads the flock's mortality itself so the one caller that
 * needs it — a server action, with no dashboard in hand — can just ask.
 */
/**
 * Birds still free to sell on the farm's running cycle — zero when there is no
 * cycle, which is also the honest answer to "how many can he book right now".
 *
 * The orders screen needs this and has only a cycle *name* to hand; the selling
 * dashboard already has it as part of the flock tile and passes that instead.
 */
export async function countAvailableOnActiveCycle(
  farmId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("cycle")
    .select("id, chick_count")
    .eq("farm_id", farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle) return 0;
  return countAvailableChickens(cycle.id, cycle.chick_count);
}

export async function countAvailableChickens(
  cycleId: string,
  chickCount: number,
): Promise<number> {
  return tallyAvailable(await createClient(), cycleId, chickCount);
}

type FarmClient = Awaited<ReturnType<typeof createClient>>;

/** The arithmetic, over whichever client the caller is entitled to read with. */
async function tallyAvailable(
  supabase: FarmClient,
  cycleId: string,
  chickCount: number,
): Promise<number> {
  const [{ data }, { data: mortality }] = await Promise.all([
    supabase
      .from("orders")
      .select("status, order_line(id)")
      .eq("cycle_id", cycleId)
      .neq("status", "cancelled"),
    supabase.from("mortality").select("count").eq("cycle_id", cycleId),
  ]);
  const orders = data ?? [];

  const countLines = (statuses: OrderStatus[]): number =>
    orders
      .filter((order) => statuses.includes(order.status))
      .reduce((sum, order) => sum + (order.order_line?.length ?? 0), 0);

  return availableChickens({
    chickCount,
    mortalityCount: (mortality ?? []).reduce((sum, m) => sum + m.count, 0),
    soldCount: countLines(DELIVERED_STATUSES),
    requestedCount: countLines(RUNNING_STATUSES),
  });
}
