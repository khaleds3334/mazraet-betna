"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/queries/admin";

/**
 * Order actions (admin only). Writes go through the RLS-bound client — the order
 * policies allow only the farm owner, so a non-admin request can't create an
 * order here even if it reached this far.
 */

export type CreateOrderInput = {
  /** null for an orphan order — one the admin books with no customer (FR-13). */
  customerId: string | null;
  /** Who the birds are actually for, when the order is placed for a relative. */
  onBehalfOf: string;
  /** How many birds — one `order_line` per bird (D-13). */
  count: number;
  /** The approximate weight the customer asked for (kg), same for every bird. */
  weight: number;
  /** Cleaning included for the whole order. */
  cleaning: boolean;
  notes: string;
};

export type CreateOrderResult = { ok: false; error: string } | { ok: true };

/**
 * Book an order from the admin side (A-56, FR-12/FR-13). The order is confirmed
 * the moment it exists — there is no approval step (D-02) — so it lands in
 * "pending" and shows up under الجديدة.
 *
 * Price is deliberately NOT stamped here: `unit_price` / `cleaning_price` are
 * snapshotted at weighing (T-15), so a price change before the birds go on the
 * scale is still picked up.
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const count = Math.trunc(input.count);
  if (!Number.isFinite(count) || count < 1) {
    return { ok: false, error: "العدد لازم يكون فرخة واحدة على الأقل." };
  }
  if (!Number.isFinite(input.weight) || input.weight <= 0) {
    return { ok: false, error: "اختار الوزن المطلوب." };
  }

  const supabase = await createClient();

  // An order belongs to a cycle — the birds come out of the running flock.
  const { data: cycle } = await supabase
    .from("cycle")
    .select("id")
    .eq("farm_id", farm.farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle) {
    return { ok: false, error: "مفيش دورة شغالة دلوقتي عشان تسجّل عليها طلب." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      farm_id: farm.farmId,
      cycle_id: cycle.id,
      customer_id: input.customerId,
      status: "pending",
      source: "admin",
      cleaning: input.cleaning,
      notes: input.notes.trim() || null,
      on_behalf_of: input.onBehalfOf.trim() || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { ok: false, error: "مقدرناش نسجّل الطلب، حاول تاني." };
  }

  // One line per bird (D-13) — the weighing screen fills the actual weight into
  // these same rows later.
  const lines = Array.from({ length: count }, (_, index) => ({
    farm_id: farm.farmId,
    order_id: order.id,
    position: index + 1,
    batch_no: 1,
    approx_weight: input.weight,
    cleaning: input.cleaning,
  }));

  const { error: linesError } = await supabase.from("order_line").insert(lines);
  if (linesError) {
    // Never leave a bird-less order behind — it would show as an empty card.
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "مقدرناش نسجّل الطلب، حاول تاني." };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Cancel an order (FR-16, A-51). Only the admin can — the customer app has no
 * cancel at all (D-04), because by the time an order is weighed the birds are
 * already slaughtered. The reason is required: the card shows it back later, and
 * "why didn't this customer get his order" is exactly what gets forgotten.
 *
 * The order keeps all its lines and its number; nothing is deleted.
 */
export async function cancelOrder(
  orderId: string,
  reason: string,
): Promise<CreateOrderResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const trimmed = reason.trim();
  if (!trimmed) {
    return { ok: false, error: "اكتب سبب الإلغاء الأول." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: trimmed,
    })
    .eq("id", orderId)
    .eq("farm_id", farm.farmId);

  if (error) {
    return { ok: false, error: "مقدرناش نلغي الطلب، حاول تاني." };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Correct the reason on an already-cancelled order (A-51's pen). Touches nothing
 * but the text — the status and `cancelled_at` stay as they were, so the order's
 * history isn't rewritten by a typo fix.
 */
export async function updateCancelReason(
  orderId: string,
  reason: string,
): Promise<CreateOrderResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const trimmed = reason.trim();
  if (!trimmed) {
    return { ok: false, error: "اكتب سبب الإلغاء الأول." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ cancel_reason: trimmed })
    .eq("id", orderId)
    .eq("farm_id", farm.farmId)
    .eq("status", "cancelled");

  if (error) {
    return { ok: false, error: "مقدرناش نحفظ السبب، حاول تاني." };
  }

  revalidatePath("/admin/orders");
  return { ok: true };
}
