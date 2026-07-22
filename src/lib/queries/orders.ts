/**
 * Order reads for the customer app.
 */
import { createClient } from "@/lib/supabase/server";
import { orderRemaining } from "@/lib/calculations/invoice";
import type { OrderStatus } from "@/lib/constants";

/** Statuses that count as an in-progress order (everything but delivered/cancelled). */
const ACTIVE_STATUSES: OrderStatus[] = ["pending", "weighed", "ready"];

/**
 * How many orders the customer has still in progress — drives the badge on the
 * "تتبع الطلب" tab in the bottom nav (C-11).
 */
export async function countActiveOrders(customerId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .in("status", ACTIVE_STATUSES);
  return count ?? 0;
}

/**
 * The customer's total outstanding debt (FR-30) — shown in the sidebar. Sum of
 * the remaining balance on every non-cancelled order, computed on read (D-05).
 */
export async function getCustomerDebt(customerId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "unit_price, cleaning_price, order_line(id, batch_no, position, actual_weight, cleaning), payment(amount)",
    )
    .eq("customer_id", customerId)
    .neq("status", "cancelled");
  if (!data) return 0;

  const total = data.reduce(
    (sum, order) =>
      sum + orderRemaining(order, order.order_line ?? [], order.payment ?? []),
    0,
  );
  return Math.round(total * 100) / 100;
}
