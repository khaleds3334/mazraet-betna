/**
 * Notification reads for the customer app.
 *
 * Nothing here writes one. Every notification in this app is written by the
 * database, on the event itself (migration 029) — the insert policy is
 * admin-only, so a customer's own session could not announce his own order even
 * if we asked it to.
 */
import { createClient } from "@/lib/supabase/server";
import { computeInvoice } from "@/lib/calculations/invoice";
import { formatCurrency, formatOrderNumber } from "@/lib/format";
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

/** Everything the delivered notice needs to price itself — see `settle`. */
const ORDER_MONEY =
  "seq, unit_price, cleaning_price, cycle(seq), order_line(id, position, batch_no, actual_weight, cleaning), payment(amount)";

/** The two notices whose sentence is a question about money — see `settle`. */
const PRICED: Enums<"notification_event">[] = ["order_ready", "order_delivered"];

/**
 * The two notices that carry figures (Khaled, 2026-08-25).
 *
 * **«طلبك جاهز للاستلام»** names what to bring — which is FR-31's «مع الإجمالي»,
 * and is the amount still owed rather than the total: a customer who paid a
 * deposit at the scale should be asked for the rest, not for the bill again. The
 * tone stays good news; being asked to pay on collection is the arrangement, not
 * a warning.
 *
 * **«تم تسليم الطلب»** is read as money rather than as a status: settled it is
 * good news, with something still owed it is a warning that names what was paid
 * and what is left.
 *
 * **Computed here, never stored.** The amounts are the order's invoice, and an
 * invoice is the order plus its weights worked out on read (D-05) — writing the
 * figures into the notification row would have been a second place the same
 * order is priced, frozen at the moment of delivery and wrong the day a payment
 * is recorded against it. This runs the same `computeInvoice` the invoice screen
 * and the history card run, so the three cannot disagree, and it stays true
 * however long the notice sits in the list.
 *
 * Only these two are re-read. Every other notice is finished the moment it is
 * written, and the sentence in the database is the whole of it.
 */
function settle(
  event: Enums<"notification_event">,
  order: {
    unit_price: number | null;
    cleaning_price: number | null;
    order_line: {
      id: string;
      position: number;
      batch_no: number;
      actual_weight: number | null;
      cleaning: boolean;
    }[];
    payment: { amount: number }[];
  },
): { kind?: Enums<"notification_kind">; body: string } {
  const invoice = computeInvoice(
    {
      unit_price: order.unit_price ?? 0,
      cleaning_price: order.cleaning_price ?? 0,
    },
    order.order_line ?? [],
    order.payment ?? [],
  );

  const { paid, remaining } = invoice;

  if (event === "order_ready") {
    if (remaining <= 0) {
      return { body: "خلص تجهيزه و تنظيفه و مدفوع بالكامل، تقدر تيجي تستلمه" };
    }
    if (paid > 0) {
      return {
        body: `خلص تجهيزه و تنظيفه، دفعت ${formatCurrency(paid)} و المطلوب ${formatCurrency(remaining)}`,
      };
    }
    return {
      body: `خلص تجهيزه و تنظيفه، المطلوب ${formatCurrency(remaining)}`,
    };
  }

  // Delivered — and here the money decides the tone as well as the words.
  if (remaining <= 0) {
    return { kind: "success", body: "تم استلامه و سداد المبلغ بالكامل" };
  }
  return {
    kind: "warning",
    body: `تم استلامه، دفعت ${formatCurrency(paid)} و باقي عليك ${formatCurrency(remaining)}`,
  };
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
    .select(`id, kind, event, title, body, is_read, created_at, order_id, orders(${ORDER_MONEY})`)
    .eq("customer_id", customerId)
    .eq("audience", "customer")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    // The notices whose figures are a question about money, and so the ones
    // worked out now rather than read back — see `settle`.
    const money =
      row.event && PRICED.includes(row.event) && row.orders
        ? settle(row.event, row.orders)
        : null;

    return {
      id: row.id,
      kind: money?.kind ?? row.kind,
      title: row.title,
      body: money?.body ?? row.body,
      orderNumber: row.orders
        ? formatOrderNumber(row.orders.cycle?.seq ?? 0, row.orders.seq ?? 0)
        : null,
      orderId: row.order_id,
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  });
}
