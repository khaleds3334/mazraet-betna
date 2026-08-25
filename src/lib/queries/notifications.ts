/**
 * Notification reads for the customer app.
 *
 * Nothing here writes one. Every notification in this app is written by the
 * database, on the event itself (migration 029) — the insert policy is
 * admin-only, so a customer's own session could not announce his own order even
 * if we asked it to.
 */
import { createClient } from "@/lib/supabase/server";
import { formatOrderNumber } from "@/lib/format";
import type { Enums } from "@/types/database";

/**
 * Count of the customer's unread notifications — drives the dot on the bell in
 * the home header (C-11). RLS already limits rows to this customer.
 */
export async function countUnreadNotifications(
  customerId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notification")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("audience", "customer")
    .eq("is_read", false);
  return count ?? 0;
}

/** One line on «الرسائل و الاشعارات» (C-15). */
export interface CustomerNotification {
  id: string;
  kind: Enums<"notification_kind">;
  title: string;
  /**
   * The sentence as stored — no number in it. On a notification about an order
   * it is written to read after «طلبك رقم ١٢٢٤#», which the row puts in front of
   * it with the real formatter (see migration 029 on why the digits stay here).
   */
  body: string | null;
  /** Already formatted, e.g. «١٢٢٤» — null when the notice is not about an order. */
  orderNumber: string | null;
  /** Where tapping it goes, or null when there is nowhere to go. */
  orderId: string | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * The customer's notifications, newest first.
 *
 * Read whole rather than paged: this is a handful of rows per cycle, and the
 * screen groups them into «الجديدة» and «القديمة» — a grouping that needs to see
 * all of both to draw either heading.
 *
 * RLS already limits the rows to this customer's own (`notification_select`), so
 * there is no `customer_id` filter to forget here.
 */
export async function listNotifications(
  customerId: string,
): Promise<CustomerNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification")
    .select("id, kind, title, body, is_read, created_at, order_id, orders(seq, cycle(seq))")
    .eq("customer_id", customerId)
    .eq("audience", "customer")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    orderNumber: row.orders
      ? formatOrderNumber(row.orders.cycle?.seq ?? 0, row.orders.seq ?? 0)
      : null,
    orderId: row.order_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}
