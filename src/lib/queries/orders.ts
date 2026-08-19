/**
 * Order reads. Split in two: what the customer app needs (their own orders and
 * debt) and what the admin's orders screen needs (A-50). The selling dashboard's
 * heavier per-cycle aggregate lives in `selling.ts` and reuses `tallyOrderTabs`
 * from here, so the two screens can never disagree on what belongs in a tab.
 */
import { createClient } from "@/lib/supabase/server";
import { orderRemaining } from "@/lib/calculations/invoice";
import { formatOrderNumber } from "@/lib/format";
import {
  ADMIN_ORDER_TABS,
  type AdminOrderTabKey,
  type OrderStatus,
} from "@/lib/constants";

/** Statuses that count as an in-progress order (everything but delivered/cancelled). */
const ACTIVE_STATUSES: OrderStatus[] = ["pending", "weighed", "ready"];

// ─────────────────────────── Customer app ───────────────────────────

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

// ──────────────────────────── Admin app ─────────────────────────────

/** How many orders sit in each of the admin's three tabs (FR-12). */
export type OrderTabCounts = Record<AdminOrderTabKey, number>;

export const EMPTY_ORDER_TAB_COUNTS: OrderTabCounts = {
  new: 0,
  active: 0,
  done: 0,
};

/**
 * Sorts orders into the admin's tabs. Pure, and driven by ADMIN_ORDER_TABS
 * itself, so adding or regrouping a status is a one-line change in constants —
 * every screen that shows these numbers follows automatically.
 */
export function tallyOrderTabs(
  orders: { status: OrderStatus }[],
): OrderTabCounts {
  const counts = { ...EMPTY_ORDER_TAB_COUNTS };
  for (const tab of ADMIN_ORDER_TABS) {
    counts[tab.key] = orders.filter((order) =>
      tab.statuses.includes(order.status),
    ).length;
  }
  return counts;
}

/**
 * The tab counts for one cycle — the numbers in the tab bar on A-50. Reads the
 * cycle's order statuses once and tallies them in memory: a single small round
 * trip instead of one COUNT query per tab.
 */
export async function getOrderTabCounts(
  farmId: string,
  cycleId: string,
): Promise<OrderTabCounts> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("status")
    .eq("farm_id", farmId)
    .eq("cycle_id", cycleId);
  return tallyOrderTabs(data ?? []);
}

/** One bird's row on the weighing sheet (A-52) — the same `order_line` (D-13). */
export interface WeighingLine {
  id: string;
  position: number;
  /** What the customer asked for — the greyed number a blank row starts on. */
  approxWeight: number | null;
  /** What the scale actually read. null until the admin weighs this bird. */
  actualWeight: number | null;
  cleaning: boolean;
}

/**
 * What the weighing sheet needs, carried on the list row rather than fetched
 * when the sheet opens. The admin taps "وزن الفراخ" standing over a scale with
 * the birds in his hands — the sheet has to be there instantly, and one extra
 * round-trip at that moment is one too many.
 */
export interface OrderWeighing {
  /** The customer's note, shown in the orange box above the rows. */
  notes: string | null;
  /** Cleaning for the whole order — the switch beside the knife. */
  cleaning: boolean;
  /** Prices snapshotted at weighing (T-15) — null until the order is weighed. */
  unitPrice: number | null;
  cleaningPrice: number | null;
  lines: WeighingLine[];
}

/** One order as the list on A-50 renders it. */
export interface OrderListItem {
  id: string;
  /** Already formatted for display, e.g. "١٠٠٤" (cycle 1, order 4). */
  number: string;
  status: OrderStatus;
  /** When the order was placed — the card's second line. */
  createdAt: string;
  /** null for an orphan order, which has no customer yet (FR-13). */
  customer: { name: string; phone: string } | null;
  /** Who the birds are for, when the order was placed for a relative. */
  onBehalfOf: string | null;
  pickupDate: string | null;
  pickupTime: string | null;
  /** How many birds — one line per bird (D-13). */
  chickenCount: number;
  /** The asked-for weight, or null when the lines don't all share one. */
  approxWeight: number | null;
  /** Why it was cancelled — only ever set on a cancelled order (A-51). */
  cancelReason: string | null;
  /** Birds taken for the family house — not a sale (FR-36). */
  isHouse: boolean;
  /** Everything the weighing sheet opens with (A-52). */
  weighing: OrderWeighing;
}

/**
 * The orders of one cycle in one tab, newest first (A-50). Each row arrives with
 * everything its card shows, so the card component stays a pure view.
 */
export async function listOrders(
  farmId: string,
  cycle: { cycleId: string; seq: number },
  statuses: OrderStatus[],
): Promise<OrderListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, seq, status, created_at, on_behalf_of, pickup_date, pickup_time, cancel_reason, is_house, notes, cleaning, unit_price, cleaning_price, customer(name, phone), order_line(id, position, approx_weight, actual_weight, cleaning)",
    )
    .eq("farm_id", farmId)
    .eq("cycle_id", cycle.cycleId)
    .in("status", statuses)
    .order("created_at", { ascending: false });

  return (data ?? []).map((order) => {
    const lines = order.order_line ?? [];
    // The card shows one "الوزن المطلوب". An order booked from A-56 always has a
    // single weight; a customer order may mix them, and then there is no single
    // number to show.
    const weights = new Set(lines.map((line) => line.approx_weight));
    return {
      id: order.id,
      number: formatOrderNumber(cycle.seq, order.seq),
      status: order.status,
      createdAt: order.created_at,
      customer: order.customer
        ? { name: order.customer.name, phone: order.customer.phone }
        : null,
      onBehalfOf: order.on_behalf_of,
      pickupDate: order.pickup_date,
      pickupTime: order.pickup_time,
      chickenCount: lines.length,
      approxWeight:
        weights.size === 1 ? (lines[0].approx_weight ?? null) : null,
      cancelReason: order.cancel_reason,
      isHouse: order.is_house,
      weighing: {
        notes: order.notes,
        cleaning: order.cleaning,
        unitPrice: order.unit_price,
        cleaningPrice: order.cleaning_price,
        lines: [...lines]
          .sort((a, b) => a.position - b.position)
          .map((line) => ({
            id: line.id,
            position: line.position,
            approxWeight: line.approx_weight,
            actualWeight: line.actual_weight,
            cleaning: line.cleaning,
          })),
      },
    };
  });
}
