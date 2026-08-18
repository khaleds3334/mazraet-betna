"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/queries/admin";
import { hasActiveCycle } from "@/lib/queries/cycles";

/**
 * Cycle actions (admin only). Writes go through the RLS-bound client — the
 * cycle_write policy allows only the farm owner (is_admin), so a non-admin
 * request can't create a cycle even if it reached here.
 */

export type CreateCycleInput = {
  name: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM (may be empty)
  chickCount: number;
  chickPrice: number;
};

export type CreateCycleResult = { ok: false; error: string } | { ok: true };

/**
 * Register a new cycle (FR-4): chick count, start date/time, chick price. Creates
 * the farm's single active cycle. Only one cycle can be active at a time, so this
 * refuses if one is already running rather than hit the DB unique-index error.
 */
export async function createCycle(
  input: CreateCycleInput,
): Promise<CreateCycleResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const chickCount = Math.trunc(input.chickCount);
  const chickPrice = input.chickPrice;
  if (!Number.isFinite(chickCount) || chickCount <= 0) {
    return { ok: false, error: "اكتب عدد الكتاكيت صح." };
  }
  if (!Number.isFinite(chickPrice) || chickPrice < 0) {
    return { ok: false, error: "اكتب سعر الكتكوت صح." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
    return { ok: false, error: "اختار تاريخ بداية الدورة." };
  }

  if (await hasActiveCycle(farm.farmId)) {
    return { ok: false, error: "فيه دورة شغالة بالفعل، لازم تخلّصها الأول." };
  }

  const name = input.name.trim();
  const startTime = input.startTime.trim();

  const supabase = await createClient();
  const { error } = await supabase.from("cycle").insert({
    farm_id: farm.farmId,
    chick_count: chickCount,
    chick_price: chickPrice,
    start_date: input.startDate,
    start_time: startTime || null,
    name: name || null,
    is_active: true,
  });

  if (error) {
    return { ok: false, error: "مقدرناش نسجّل الدورة، حاول تاني." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/cycles");
  return { ok: true };
}

export type ActionResult = { ok: false; error: string } | { ok: true };

/**
 * Record dead birds on the active cycle (FR-23, A-14). The live count and the
 * mortality rate on the dashboard drop automatically because both derive from
 * the mortality rows on read. Admin-only via RLS (mortality_all → is_admin).
 */
export async function recordMortality(count: number): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const n = Math.trunc(count);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: "اكتب عدد النافق صح." };
  }

  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("cycle")
    .select("id")
    .eq("farm_id", farm.farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle) return { ok: false, error: "مفيش دورة شغالة دلوقتي." };

  const { error } = await supabase
    .from("mortality")
    .insert({ farm_id: farm.farmId, cycle_id: cycle.id, count: n });

  if (error) return { ok: false, error: "مقدرناش نسجّل النفوق، حاول تاني." };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Open the selling phase on the active cycle (A-11 "بدء مرحلة البيع" → the
 * confirm dialog, node 3608:3838). Sets the kilo price the cycle sells at and
 * flips `sale_open` on, which moves the admin home to the selling dashboard and
 * lets customers order (FR-11).
 *
 * The price lands on `settings.sale_price`, so the admin can change it later from
 * Settings without touching this cycle — and an already-weighed order keeps its
 * own snapshotted price, so past invoices never move (T-15, FR-5).
 *
 * The price is written first: if that succeeds but the flip fails, the sale stays
 * closed and the admin simply retries. The reverse order could open the sale at
 * the old price, which is the expensive mistake.
 */
export async function startSelling(salePrice: number): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return { ok: false, error: "اكتب سعر كيلو الفراخ الأول." };
  }

  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("cycle")
    .select("id")
    .eq("farm_id", farm.farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle) return { ok: false, error: "مفيش دورة شغالة دلوقتي." };

  const { error: priceError } = await supabase
    .from("settings")
    .update({ sale_price: salePrice })
    .eq("farm_id", farm.farmId);
  if (priceError) {
    return { ok: false, error: "مقدرناش نحفظ السعر، حاول تاني." };
  }

  const { error } = await supabase
    .from("cycle")
    .update({ sale_open: true })
    .eq("id", cycle.id);

  if (error) return { ok: false, error: "مقدرناش نفتح البيع، حاول تاني." };

  revalidatePath("/admin");
  revalidatePath("/"); // opening the sale changes the customer home too
  return { ok: true };
}
