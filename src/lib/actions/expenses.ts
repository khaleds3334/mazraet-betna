"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm, type CurrentFarm } from "@/lib/queries/admin";
import type { ExpenseCategory } from "@/lib/constants";
import { feedBagsAvailable } from "@/lib/calculations/feed";
import { NO_FEED_IN_STORE } from "@/lib/constants";
import type { ActionResult } from "./cycles";

/**
 * Expense recording (admin only, A-15 "تسجيل مصاريف"). Feed purchases land in the
 * `feed` table (they carry bag counts + price and feed the available/withdrawn
 * figures); every other category is a plain amount in the `expense` table. Both
 * flow into the cycle's expenses total on read (FR-18, FR-19, FR-22).
 */

/** The active cycle for the current admin (farm + cycle, either may be null). */
async function activeCycle(): Promise<{
  farm: CurrentFarm | null;
  cycle: { id: string; start_date: string } | null;
}> {
  const farm = await getCurrentFarm();
  if (!farm) return { farm: null, cycle: null };
  const supabase = await createClient();
  const { data } = await supabase
    .from("cycle")
    .select("id, start_date")
    .eq("farm_id", farm.farmId)
    .eq("is_active", true)
    .maybeSingle();
  return { farm, cycle: data ?? null };
}

/**
 * Record a manual expense (utilities / medicine / other).
 *
 * `quantity` is how many were bought — three bottles of medicine, one water bill.
 * It defaults to one, and the amount is then **derived**: quantity × unit price.
 * Storing the breakdown rather than only the total is what lets the itemised
 * table (A-47) fill its العدد and السعر columns with something the admin actually
 * typed, instead of guessing it back from a single number.
 */
export async function addExpense(input: {
  category: ExpenseCategory;
  description: string;
  /** Price of one. With `quantity` = 1 this is simply the amount. */
  unitPrice: number;
  quantity?: number;
}): Promise<ActionResult> {
  const { farm, cycle } = await activeCycle();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };
  if (!cycle) return { ok: false, error: "مفيش دورة شغالة دلوقتي." };

  const unitPrice = Number(input.unitPrice);
  const quantity = Number(input.quantity ?? 1);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return { ok: false, error: "اكتب قيمة المصروف صح." };
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, error: "اكتب العدد صح." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expense").insert({
    farm_id: farm.farmId,
    cycle_id: cycle.id,
    category: input.category,
    description: input.description.trim() || null,
    quantity,
    unit_price: unitPrice,
    amount: Math.round(quantity * unitPrice * 100) / 100,
  });

  if (error) return { ok: false, error: "مقدرناش نسجّل المصروف، حاول تاني." };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Record a utilities bill (مياه وكهرباء, A-17). Electricity and water are two
 * separate bills, so each becomes its own `expense` row (category `utilities`) —
 * they read back as distinct line items in the cycle's expenses. The electricity
 * meter readings (البداية/النهاية) are optional and, when given, kept in the row's
 * description for the record. At least one bill must be > 0.
 */
export async function addUtilitiesExpense(input: {
  elecStart?: number;
  elecEnd?: number;
  elecBill: number;
  waterBill: number;
}): Promise<ActionResult> {
  const { farm, cycle } = await activeCycle();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };
  if (!cycle) return { ok: false, error: "مفيش دورة شغالة دلوقتي." };

  const elecBill = Number(input.elecBill);
  const waterBill = Number(input.waterBill);
  if (!(elecBill > 0) && !(waterBill > 0)) {
    return { ok: false, error: "اكتب قيمة فاتورة واحدة على الأقل." };
  }

  const rows: {
    farm_id: string;
    cycle_id: string;
    category: ExpenseCategory;
    description: string;
    quantity: number | null;
    unit_price: number;
    amount: number;
  }[] = [];

  if (elecBill > 0) {
    const start = Number(input.elecStart);
    const end = Number(input.elecEnd);
    const hasReading = start > 0 && end > 0;
    // The meter reading IS the quantity — he already types it, so the itemised
    // table (A-47) gets its العدد for free, and the price per kilowatt-hour falls
    // out of the bill he actually paid. No extra field to fill while standing in
    // the shed.
    //
    // The description stays the plain word «كهرباء»: it is the الصنف column of
    // that table, and a whole sentence about meter readings does not belong in a
    // column ~110px wide (Khaled, 2026-08-20). The consumption it used to spell
    // out is the `quantity` beside it now.
    const kilowattHours = hasReading ? end - start : null;
    rows.push({
      farm_id: farm.farmId,
      cycle_id: cycle.id,
      category: "utilities",
      description: "كهرباء",
      quantity: kilowattHours,
      unit_price:
        kilowattHours && kilowattHours > 0
          ? Math.round((elecBill / kilowattHours) * 100) / 100
          : elecBill,
      amount: elecBill,
    });
  }
  if (waterBill > 0) {
    // A water bill is one bill — there is nothing to count.
    rows.push({
      farm_id: farm.farmId,
      cycle_id: cycle.id,
      category: "utilities",
      description: "مياه",
      quantity: 1,
      unit_price: waterBill,
      amount: waterBill,
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expense").insert(rows);

  if (error) return { ok: false, error: "مقدرناش نسجّل المصروف، حاول تاني." };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Record a feed purchase — starter (بادي) and/or grower (نامي) bags, each with a
 * per-bag price. One `feed` row per non-empty phase, each stamped with its phase
 * (migration 013) so nothing downstream has to infer it back. Increases
 * العلف المتوفر.
 */
export async function addFeedPurchase(input: {
  badiBags: number;
  badiPrice: number;
  namiBags: number;
  namiPrice: number;
}): Promise<ActionResult> {
  const { farm, cycle } = await activeCycle();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };
  if (!cycle) return { ok: false, error: "مفيش دورة شغالة دلوقتي." };

  const rows = (
    [
      {
        phase: "badi",
        bags: Math.trunc(input.badiBags),
        price: Number(input.badiPrice),
      },
      {
        phase: "nami",
        bags: Math.trunc(input.namiBags),
        price: Number(input.namiPrice),
      },
    ] as const
  )
    .filter((r) => r.bags > 0)
    .map((r) => ({
      farm_id: farm.farmId,
      cycle_id: cycle.id,
      phase: r.phase,
      bags: r.bags,
      bag_price: Number.isFinite(r.price) && r.price > 0 ? r.price : 0,
    }));

  if (rows.length === 0) {
    return { ok: false, error: "اكتب عدد الشكاير الأول." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("feed").insert(rows);

  if (error) return { ok: false, error: "مقدرناش نسجّل العلف، حاول تاني." };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Record a feed withdrawal — the admin opened a bag (A-13 "سحب شكارة"). One row =
 * one 50kg شكارة (`bags` defaults to 1). `withdrawnOn` is the day the bag was
 * opened (`yyyy-mm-dd`); it lights that day's square on the consumption grid and
 * lowers العلف المتوفر. The day must sit inside the cycle (≥ start, not future) so
 * it maps to a real grid cell (FR-22, see D-17).
 */
export async function addFeedWithdrawal(input: {
  withdrawnOn: string;
  /** `HH:mm` the bag was opened; shown on the bag-detail popup. Optional. */
  withdrawnAt?: string;
}): Promise<ActionResult> {
  const { farm, cycle } = await activeCycle();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };
  if (!cycle) return { ok: false, error: "مفيش دورة شغالة دلوقتي." };

  const withdrawn = new Date(input.withdrawnOn);
  if (Number.isNaN(withdrawn.getTime())) {
    return { ok: false, error: "اختار يوم فتح الشكارة الأول." };
  }
  const start = new Date(cycle.start_date);
  // Upper bound with a day of grace so a late-night entry never trips on the
  // server/local timezone gap.
  const maxDay = new Date();
  maxDay.setDate(maxDay.getDate() + 1);
  if (withdrawn < start) {
    return { ok: false, error: "التاريخ ده قبل بداية الدورة." };
  }
  if (withdrawn > maxDay) {
    return { ok: false, error: "مينفعش تختار يوم في المستقبل." };
  }

  const supabase = await createClient();

  // A bag comes out of the store, so there has to be one in it. Checked here and
  // not only in the popup: the count the screen was rendered with can be minutes
  // old, and two taps on a slow connection would otherwise open the same last bag
  // twice — which quietly puts العلف المتوفر into a hole nothing can climb out of.
  const [{ data: purchases }, { data: withdrawals }] = await Promise.all([
    supabase.from("feed").select("bags").eq("cycle_id", cycle.id),
    supabase.from("feed_withdrawal").select("bags").eq("cycle_id", cycle.id),
  ]);
  if (feedBagsAvailable(purchases ?? [], withdrawals ?? []) < 1) {
    return { ok: false, error: NO_FEED_IN_STORE };
  }

  const { error } = await supabase.from("feed_withdrawal").insert({
    farm_id: farm.farmId,
    cycle_id: cycle.id,
    withdrawn_on: input.withdrawnOn,
    withdrawn_at: input.withdrawnAt || null,
  });

  if (error) return { ok: false, error: "مقدرناش نسجّل سحب الشكارة، حاول تاني." };

  revalidatePath("/admin");
  return { ok: true };
}
