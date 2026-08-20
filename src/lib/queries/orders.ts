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

/**
 * How many of a cycle's orders are still open — waiting, weighed, or ready, but
 * not yet handed over. Ending a cycle is refused while any of them are (D-36):
 * a cycle that closes over an unfinished order strands it in history, where the
 * orders screen no longer looks.
 */
export async function countOpenCycleOrders(cycleId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("cycle_id", cycleId)
    .in("status", ACTIVE_STATUSES);
  return count ?? 0;
}

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

/** One bird's row on the weighing sheet (A-52) — the same `order_line` (D-13). */
export interface WeighingLine {
  id: string;
  position: number;
  /** Which bag this bird is in (FR-14ب). 1 unless the order was split. */
  batchNo: number;
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
  /** When the birds were handed over — the invoice sheet's header line. */
  deliveredAt: string | null;
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
  /** What has been paid so far — the card works its own remainder out (FR-17). */
  payments: { amount: number }[];
}

/**
 * Every order of one cycle, newest first (A-50). Each row arrives with
 * everything its card shows, so the card component stays a pure view.
 *
 * The whole cycle in one read, not one read per tab. The three tabs are three
 * views of the same set, so this single query feeds all of them *and* the counts
 * above them (`tallyOrderTabs`) — which is both one round trip instead of two,
 * and the reason the numbers can never disagree with the list under them: they
 * are counted off the same rows.
 *
 * It is also what makes switching tabs cost nothing. The admin was waiting
 * seconds for a filter, because a tab was a fresh trip through auth → farm →
 * cycle → count → list every time (D-31).
 */
/** Everything an `OrderListItem` is built from — one place, so two lists can't drift. */
const ORDER_COLUMNS =
  "id, seq, status, created_at, delivered_at, on_behalf_of, pickup_date, pickup_time, cancel_reason, is_house, notes, cleaning, unit_price, cleaning_price, customer(name, phone), order_line(id, position, batch_no, approx_weight, actual_weight, cleaning), payment(amount)";

/** The shape {@link ORDER_COLUMNS} comes back as. */
interface OrderRow {
  id: string;
  seq: number | null;
  status: OrderStatus;
  created_at: string;
  delivered_at: string | null;
  on_behalf_of: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  cancel_reason: string | null;
  is_house: boolean;
  notes: string | null;
  cleaning: boolean;
  unit_price: number | null;
  cleaning_price: number | null;
  customer: { name: string; phone: string } | null;
  order_line: {
    id: string;
    position: number;
    batch_no: number;
    approx_weight: number | null;
    actual_weight: number | null;
    cleaning: boolean;
  }[];
  payment: { amount: number }[];
}

/**
 * One order row as the card reads it. `cycleSeq` is the first digit of the
 * displayed order number, so it comes from whichever cycle the order belongs to —
 * the orders screen knows it once for the whole list, a customer's history has a
 * different one per order.
 */
function toOrderListItem(order: OrderRow, cycleSeq: number): OrderListItem {
  const lines = order.order_line ?? [];
  // The card shows one "الوزن المطلوب". An order booked from A-56 always has a
  // single weight; a customer order may mix them, and then there is no single
  // number to show.
  const weights = new Set(lines.map((line) => line.approx_weight));

  return {
    id: order.id,
    number: formatOrderNumber(cycleSeq, order.seq ?? 0),
    status: order.status,
    createdAt: order.created_at,
    deliveredAt: order.delivered_at,
    customer: order.customer
      ? { name: order.customer.name, phone: order.customer.phone }
      : null,
    onBehalfOf: order.on_behalf_of,
    pickupDate: order.pickup_date,
    pickupTime: order.pickup_time,
    chickenCount: lines.length,
    approxWeight: weights.size === 1 ? (lines[0].approx_weight ?? null) : null,
    cancelReason: order.cancel_reason,
    isHouse: order.is_house,
    payments: order.payment ?? [],
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
          batchNo: line.batch_no,
          approxWeight: line.approx_weight,
          actualWeight: line.actual_weight,
          cleaning: line.cleaning,
        })),
    },
  };
}

/**
 * Every order of one cycle, newest first — the admin orders screen (A-50). The
 * screen splits them into its three tabs itself (D-31).
 */
export async function listCycleOrders(
  farmId: string,
  cycle: { cycleId: string; seq: number },
): Promise<OrderListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("farm_id", farmId)
    .eq("cycle_id", cycle.cycleId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((order) => toOrderListItem(order, cycle.seq));
}

/** An order in a customer's history, tagged with the cycle it belongs to. */
export interface CustomerOrder extends OrderListItem {
  /** True when the order is on the cycle the admin is currently working. */
  inCurrentCycle: boolean;
}

/**
 * Everything one customer has ever ordered, newest first — the history behind
 * their row (A-32). Cancelled orders are included: "why did I never get it?" is
 * exactly the question this list is opened to answer.
 *
 * Read on demand rather than with the customers screen: this is one customer's
 * whole history, and shipping every customer's up front would send a list the
 * admin opens one row of.
 */
export async function listCustomerOrders(
  farmId: string,
  customerId: string,
  currentCycleId: string | null,
): Promise<CustomerOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(`${ORDER_COLUMNS}, cycle_id, cycle(seq)`)
    .eq("farm_id", farmId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((order) => ({
    ...toOrderListItem(order, order.cycle?.seq ?? 0),
    inCurrentCycle: order.cycle_id === currentCycleId,
  }));
}
