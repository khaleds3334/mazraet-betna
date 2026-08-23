"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getFarmSettings } from "@/lib/queries/settings";
import { countAvailableForCustomer } from "@/lib/queries/ordering";
import { bookableSlots, farmToday } from "@/lib/pickupSlots";
import { SALE_NOT_OPEN } from "@/lib/constants";
import { pluralizeChicken } from "@/lib/format";

/**
 * The customer's own order (C-20→C-25, FR-27) — the other half of `createOrder`,
 * which is the admin's.
 *
 * They stay two actions rather than one with a flag. Almost nothing about them
 * is shared: this one identifies the buyer from the session instead of a picked
 * customer, has no orphan and no house order (FR-13, FR-36), and takes a pickup
 * day and slot that A-56 never asks for. A single action would be a body of
 * branches on who is calling it, and the two callers are the two apps.
 *
 * What they do share is the rules, and those live below the app: the sale closes
 * itself when the flock runs out, by trigger (migration 026), so this action does
 * not have to remember to close it.
 */

export type PlaceOrderInput = {
  /** How many birds — one `order_line` per bird (D-13). */
  count: number;
  /** The approximate weight asked for (kg), the same for every bird. */
  weight: number;
  /** Slaughtering and cleaning included (FR-27). */
  cleaning: boolean;
  /** Pickup day, `YYYY-MM-DD`. */
  pickupDate: string;
  /** Pickup slot, stored as its `HH:mm` — the label is looked up for display. */
  pickupTime: string;
  /** Optional note, folded behind «اضافة ملاحظة» on the form. */
  notes: string;
};

export type PlaceOrderResult =
  | { ok: false; error: string }
  | { ok: true; orderId: string };

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const count = Math.trunc(input.count);
  if (!Number.isFinite(count) || count < 1) {
    return { ok: false, error: "اختار عدد الفراخ الأول." };
  }
  if (!Number.isFinite(input.weight) || input.weight <= 0) {
    return { ok: false, error: "اختار الوزن المطلوب." };
  }
  if (!input.pickupDate || !input.pickupTime) {
    return { ok: false, error: "اختار يوم ووقت الاستلام." };
  }

  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("cycle")
    .select("id, sale_open")
    .eq("farm_id", customer.farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle || !cycle.sale_open) {
    return { ok: false, error: SALE_NOT_OPEN };
  }

  // The form's counter already stops at this number. This is the half that holds
  // when the screen is stale — birds can be booked out from under a customer
  // between opening the form and confirming it, and two people ordering the last
  // three birds at once is exactly the case the screen cannot see.
  const available = await countAvailableForCustomer(customer.farmId);
  if (available <= 0) {
    return { ok: false, error: "الفراخ خلصت من المزرعة دلوقتي." };
  }
  if (count > available) {
    return {
      ok: false,
      error: `فاضل ${pluralizeChicken(available)} بس — قلّل العدد.`,
    };
  }

  const settings = await getFarmSettings(customer.farmId);

  // Checked here and not only in the form, for the same reason as the count: the
  // form was drawn at some earlier minute. Someone who leaves it open through the
  // afternoon must not book a slot that has since gone by.
  // The farm's clock, not this server's — see `farmToday`.
  const today = farmToday();
  if (input.pickupDate < today) {
    return { ok: false, error: "اختار يوم من النهاردة او بعده." };
  }
  const stillOpen = bookableSlots(settings.pickupSlots, input.pickupDate);
  if (!stillOpen.some((slot) => slot.time === input.pickupTime)) {
    return { ok: false, error: "الميعاد ده فات، اختار ميعاد تاني." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      farm_id: customer.farmId,
      cycle_id: cycle.id,
      customer_id: customer.id,
      // The quote, held from this moment (T-15 as amended). The customer was
      // shown this price when he ordered, so it is the price he pays — even if
      // the admin edits it before the birds reach the scale.
      unit_price: settings.salePrice,
      cleaning_price: settings.cleaningPrice,
      // Confirmed the moment it exists — there is no approval step (D-02).
      status: "pending",
      source: "customer",
      cleaning: input.cleaning,
      pickup_date: input.pickupDate,
      pickup_time: input.pickupTime,
      notes: input.notes.trim() || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { ok: false, error: "مقدرناش نبعت الطلب، حاول تاني." };
  }

  // One line per bird (D-13) — the admin fills the actual weights into these
  // same rows at the scale.
  const lines = Array.from({ length: count }, (_, index) => ({
    farm_id: customer.farmId,
    order_id: order.id,
    position: index + 1,
    batch_no: 1,
    approx_weight: input.weight,
    cleaning: input.cleaning,
  }));

  const { error: linesError } = await supabase.from("order_line").insert(lines);
  if (linesError) {
    // Never leave a bird-less order behind — it would reach the admin as an
    // empty card he cannot act on.
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, error: "مقدرناش نبعت الطلب، حاول تاني." };
  }

  // No `syncSaleWithFlock` here, unlike the admin's action: it reads the flock,
  // and this session cannot see it (T-58). The database trigger does the same
  // work with the rights to do it correctly (migration 026), which is the reason
  // the rule was moved down there.
  revalidatePath("/", "layout");
  revalidatePath("/tracking");
  return { ok: true, orderId: order.id };
}
