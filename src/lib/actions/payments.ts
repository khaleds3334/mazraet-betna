"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/queries/admin";
import { computeInvoice } from "@/lib/calculations/invoice";
import { ORPHAN_MUST_BE_PAID } from "@/lib/constants";

export type PaymentResult = { ok: false; error: string } | { ok: true };

/**
 * Hand a ready order over, recording whatever the customer paid on the spot
 * (FR-17, A-62). One action rather than two, because a payment saved without the
 * handover — or a handover saved without the payment — is a wrong answer to
 * "does he still owe me?", and that question is the whole ledger.
 *
 * A payment of zero is a real outcome, not a failure: the birds go with him and
 * the invoice becomes his debt. There is no separate "he'll pay later".
 */
export async function deliverOrder(input: {
  orderId: string;
  amount: number;
}): Promise<PaymentResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  if (!Number.isFinite(input.amount) || input.amount < 0) {
    return { ok: false, error: "المبلغ مش مظبوط." };
  }

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, customer_id, is_house, unit_price, cleaning_price, order_line(id, batch_no, position, actual_weight, cleaning), payment(amount)",
    )
    .eq("id", input.orderId)
    .eq("farm_id", farm.farmId)
    .maybeSingle();
  if (!order) return { ok: false, error: "الطلب ده مش موجود." };
  if (order.status !== "ready") {
    return { ok: false, error: "الطلب ده مش جاهز للاستلام." };
  }

  // What is owed is worked out here, not taken from the screen: the number in
  // the dialog was true when it was drawn, and a payment may have landed since.
  const { remaining } = computeInvoice(
    order,
    order.order_line ?? [],
    order.payment ?? [],
  );
  const paid = Math.min(input.amount, Math.max(0, remaining));

  // An orphan order belongs to nobody (FR-13), so nothing carries its debt once
  // the birds are gone — it is left out of every per-customer tally on purpose.
  // Handing it over unpaid doesn't create a debt, it deletes the money. A house
  // order is the deliberate opposite: nobody's *because* it was never a sale
  // (FR-36), so it passes untouched (D-42).
  if (!order.customer_id && !order.is_house && remaining - paid > 0) {
    return { ok: false, error: ORPHAN_MUST_BE_PAID };
  }

  if (paid > 0) {
    const { error } = await supabase.from("payment").insert({
      farm_id: farm.farmId,
      order_id: order.id,
      amount: paid,
    });
    if (error) return { ok: false, error: "مقدرناش نسجّل الدفع، حاول تاني." };
  }

  const { error: statusError } = await supabase
    .from("orders")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "ready");

  if (statusError) {
    // The payment stands — it is the part that must never be lost. Say plainly
    // that the handover didn't record, so he taps again rather than assuming.
    return { ok: false, error: "الدفع اتسجّل بس الطلب مااتقفلش، حاول تاني." };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  return { ok: true };
}

/**
 * Record an instalment against an order already handed over (A-50, FR-17).
 * Payment doesn't end at the door: the customer settles the rest days later, in
 * whatever pieces he settles it in, and each one lands here.
 *
 * Capped at what is still owed, worked out from the order itself rather than
 * taken from the screen — the card was drawn before this tap, and another
 * payment may have landed in between.
 */
export async function recordPayment(input: {
  orderId: string;
  amount: number;
}): Promise<PaymentResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, error: "اكتب المبلغ اللي اتدفع." };
  }

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, unit_price, cleaning_price, order_line(id, batch_no, position, actual_weight, cleaning), payment(amount)",
    )
    .eq("id", input.orderId)
    .eq("farm_id", farm.farmId)
    .maybeSingle();
  if (!order) return { ok: false, error: "الطلب ده مش موجود." };

  const { remaining } = computeInvoice(
    order,
    order.order_line ?? [],
    order.payment ?? [],
  );
  if (remaining <= 0) return { ok: false, error: "الطلب ده مفيهوش مبلغ متبقي." };

  const { error } = await supabase.from("payment").insert({
    farm_id: farm.farmId,
    order_id: order.id,
    amount: Math.min(input.amount, remaining),
  });
  if (error) return { ok: false, error: "مقدرناش نسجّل الدفع، حاول تاني." };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  return { ok: true };
}
