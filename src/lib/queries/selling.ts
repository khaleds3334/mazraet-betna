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
      "status, unit_price, cleaning_price, order_line(id, batch_no, position, actual_weight, cleaning), payment(amount)",
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

  const money = sumInvoices(
    orders.map((order) => ({
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
