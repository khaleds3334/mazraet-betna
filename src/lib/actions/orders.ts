"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/queries/admin";
import { getFarmSettings } from "@/lib/queries/settings";
import { getOrder, type OrderListItem } from "@/lib/queries/orders";
import { countAvailableChickens } from "@/lib/queries/selling";
import { ORPHAN_MUST_BE_PAID, SALE_NOT_OPEN } from "@/lib/constants";
import { orderRemaining } from "@/lib/calculations/invoice";
import { pluralizeChicken } from "@/lib/format";

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
  /**
   * Birds for the family's own house (FR-36). They leave the flock like any
   * other order, but they are not a sale: no revenue, no debt, no customer.
   */
  isHouse: boolean;
};

export type CreateOrderResult =
  | { ok: false; error: string }
  /** `orderId` is set only by {@link createOrder} — it is the order it just made,
   *  so «تأكيد الطلب ووزن الفراخ» can open the weighing sheet on it (D-50). */
  | { ok: true; orderId?: string };

/**
 * Book an order from the admin side (A-56, FR-12/FR-13). The order is confirmed
 * the moment it exists — there is no approval step (D-02) — so it lands in
 * "pending" and shows up under الجديدة.
 *
 * Price is stamped here, at the moment the order is taken (T-15 as amended,
 * Khaled 2026-08-21): the customer is quoted a price when they order, so that
 * is the price they pay. Editing the kilo price in settings mid-sale moves only
 * the orders taken after it — the ones already booked keep what they were told,
 * even if they are weighed days later.
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

  // An order belongs to a cycle — the birds come out of the running flock, and
  // only while that flock is actually for sale. Booking during التربية would
  // promise birds that are weeks from ready, and the order would sit in a cycle
  // the orders screen isn't even looking at (Khaled, 2026-08-20).
  const { data: cycle } = await supabase
    .from("cycle")
    .select("id, sale_open, sale_closes_at, chick_count")
    .eq("farm_id", farm.farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle) {
    return { ok: false, error: "مفيش دورة شغالة دلوقتي عشان تسجّل عليها طلب." };
  }
  if (!cycle.sale_open) {
    return { ok: false, error: SALE_NOT_OPEN };
  }

  // **The flock is finite.** Nothing used to say so here: an order for six birds
  // went through on a cycle with four left, and on one with none at all, and the
  // «الفراخ المتوفرة» tile just sat at zero while orders kept arriving (Khaled,
  // 2026-08-22). The count already existed — `countAvailableChickens`, the same
  // one the tile shows and the same one `endCycle` refuses to close over — it was
  // simply never asked at the one moment birds get promised away.
  //
  // The sheet caps its stepper at this number too, so in practice he never
  // reaches these messages. This is the half that holds when the screen is stale:
  // two birds can be booked out from under him between opening the sheet and
  // confirming it.
  const available = await countAvailableChickens(cycle.id, cycle.chick_count);
  if (available <= 0) {
    return { ok: false, error: "مفيش فراخ متاحة في الدورة دي." };
  }
  if (count > available) {
    return {
      ok: false,
      error: `متبقي ${pluralizeChicken(available)} بس في الدورة — قلّل العدد.`,
    };
  }

  const settings = await getFarmSettings(farm.farmId);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      farm_id: farm.farmId,
      cycle_id: cycle.id,
      // The quote, held from this moment (T-15 as amended). Cleaning is stamped
      // whether or not this order takes it — the admin can switch cleaning on at
      // the scale, and it must cost what it cost when the order was placed.
      unit_price: settings.salePrice,
      cleaning_price: settings.cleaningPrice,
      // A house order belongs to nobody — that is what keeps it out of every
      // per-customer debt tally without those having to know about it.
      customer_id: input.isHouse ? null : input.customerId,
      is_house: input.isHouse,
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

  // **Auto-close when the flock runs out** (FR-11). The last order takes the
  // last bird, and the sale has to be shut before the next customer is offered
  // one that does not exist — the admin is at the counter, not watching a tile.
  //
  // `sale_closes_at` is stamped on the way out if the cycle never had one, for
  // the same reason a manual close does it (`setSaleOpen`): without a date there
  // is nothing to tell "closed for now" from "never opened", and the switch in
  // settings could not bring the sale back if birds turn up — a miscount, or a
  // cancelled order handing its birds back.
  if (available - count <= 0) {
    await supabase
      .from("cycle")
      .update({
        sale_open: false,
        ...(cycle.sale_closes_at
          ? {}
          : { sale_closes_at: new Date().toISOString() }),
      })
      .eq("id", cycle.id);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/", "layout"); // the customer's home reads the sale state
  return { ok: true, orderId: order.id };
}

/**
 * The order the admin has just created, ready for the weighing sheet (D-50).
 *
 * A server *action* around a read, the same way `fetchCustomerOrders` is: the
 * add-order sheet is a client component and cannot call a query, and the query
 * itself stays in `/lib/queries` where every other read of an order lives. It
 * writes nothing.
 */
export async function fetchOrder(
  orderId: string,
): Promise<OrderListItem | null> {
  const farm = await getCurrentFarm();
  if (!farm) return null;
  return getOrder(farm.farmId, orderId);
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

/** One bird as the weighing sheet hands it back. */
export type WeighedLineInput = {
  /** The `order_line` row this came from — absent for a bird added while weighing. */
  id?: string;
  position: number;
  /** Which bag this bird goes in (FR-14ب). */
  batchNo: number;
  approxWeight: number | null;
  /** The scale reading, in kg. Every bird kept must have one. */
  actualWeight: number;
};

export type SaveWeightsInput = {
  orderId: string;
  /** Cleaning for the whole order — the switch at the top of the sheet. */
  cleaning: boolean;
  lines: WeighedLineInput[];
};

/**
 * Record an order's actual weights (A-52, FR-14) — the write the whole project
 * exists for. The order moves to "تم الوزن" and its invoice becomes real, because
 * the invoice IS the order: these same `order_line` rows now carry a weight, and
 * `computeInvoice` reads a total off them (D-05).
 *
 * Prices are stamped here, not at booking (T-15): the kilo price and cleaning fee
 * are copied onto the order the first time it is weighed, so a later price change
 * never rewrites an invoice the customer has already been told.
 *
 * Re-weighing is allowed — the admin can reopen a weighed order and fix a number
 * (FR-16). The stamped prices are kept on a re-weigh, for the same reason.
 */
export async function saveWeights(
  input: SaveWeightsInput,
): Promise<CreateOrderResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  if (input.lines.length === 0) {
    return { ok: false, error: "لازم تسيب فرخة واحدة على الأقل في الطلب." };
  }
  if (input.lines.some((line) => !(line.actualWeight > 0))) {
    return { ok: false, error: "في فرخة لسه من غير وزن — اوزنها او امسحها." };
  }

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, unit_price, cleaning_price")
    .eq("id", input.orderId)
    .eq("farm_id", farm.farmId)
    .maybeSingle();
  if (!order) return { ok: false, error: "الطلب ده مش موجود." };
  if (order.status === "cancelled") {
    return { ok: false, error: "الطلب ده ملغي — مينفعش يتوزن." };
  }

  const settings = await getFarmSettings(farm.farmId);
  // The order carries its own price from the moment it was booked (T-15 as
  // amended). The fallback is only for orders taken before that change — they
  // were stamped here instead, and stamping them now is the closest we can get.
  const unitPrice = order.unit_price ?? settings.salePrice;
  const cleaningPrice = order.cleaning_price ?? settings.cleaningPrice;

  const failed = { ok: false, error: "مقدرناش نحفظ الأوزان، حاول تاني." } as const;

  const row = (line: WeighedLineInput) => ({
    farm_id: farm.farmId,
    order_id: order.id,
    position: line.position,
    batch_no: line.batchNo,
    approx_weight: line.approxWeight,
    actual_weight: line.actualWeight,
    cleaning: input.cleaning,
  });

  // Birds the admin removed while weighing (FR-14ج) are gone from the order.
  const keptIds = input.lines
    .map((line) => line.id)
    .filter((id): id is string => id != null);
  const removals = supabase
    .from("order_line")
    .delete()
    .eq("order_id", order.id);
  const { error: deleteError } = await (keptIds.length > 0
    ? removals.not("id", "in", `(${keptIds.join(",")})`)
    : removals);
  if (deleteError) return failed;

  // Kept birds are updated in place — same row, now with a weight. Birds added
  // on this screen are new rows; the two can't go in one call, because an upsert
  // needs every row to carry the same columns.
  const kept = input.lines.filter((line) => line.id != null);
  if (kept.length > 0) {
    const { error } = await supabase
      .from("order_line")
      .upsert(kept.map((line) => ({ id: line.id, ...row(line) })));
    if (error) return failed;
  }

  const added = input.lines.filter((line) => line.id == null);
  if (added.length > 0) {
    const { error } = await supabase.from("order_line").insert(added.map(row));
    if (error) return failed;
  }

  const { error: orderError } = await supabase
    .from("orders")
    .update({
      status: "weighed",
      weighed_at: new Date().toISOString(),
      cleaning: input.cleaning,
      unit_price: unitPrice,
      cleaning_price: cleaningPrice,
    })
    .eq("id", order.id);
  if (orderError) return failed;

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}

/** Each stage may only be reached from the one before it. */
const STAGE_BEFORE = { ready: "weighed", delivered: "ready" } as const;

/**
 * Move a weighed order along: ready for collection, then collected (FR-15, A-50).
 * Nothing about the money changes at either step — the invoice was settled when
 * the birds were weighed — so these are plain status moves.
 *
 * The update names the stage the order must currently be in, so a double tap or
 * a stale card can never drag an order backwards or skip it past a step.
 *
 * **One exception: an orphan order must be paid before it is handed over**
 * (D-42). An order with no customer belongs to nobody (FR-13), so nothing carries
 * its debt afterwards — it is left out of every per-customer tally on purpose.
 * Handing the birds over unpaid therefore doesn't create a debt, it deletes the
 * money. A house order is the deliberate opposite: it is nobody's *because* it
 * was never a sale, so it passes untouched.
 */
export async function advanceOrder(
  orderId: string,
  to: keyof typeof STAGE_BEFORE,
): Promise<CreateOrderResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const supabase = await createClient();

  if (to === "delivered") {
    const { data: order } = await supabase
      .from("orders")
      .select(
        "customer_id, is_house, unit_price, cleaning_price, order_line(id, batch_no, position, actual_weight, cleaning), payment(amount)",
      )
      .eq("id", orderId)
      .eq("farm_id", farm.farmId)
      .maybeSingle();

    if (order && !order.customer_id && !order.is_house) {
      const remaining = orderRemaining(
        order,
        order.order_line ?? [],
        order.payment ?? [],
      );
      if (remaining > 0) return { ok: false, error: ORPHAN_MUST_BE_PAID };
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: to,
      ...(to === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
    })
    .eq("id", orderId)
    .eq("farm_id", farm.farmId)
    .eq("status", STAGE_BEFORE[to]);

  if (error) return { ok: false, error: "مقدرناش نغيّر حالة الطلب، حاول تاني." };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}
