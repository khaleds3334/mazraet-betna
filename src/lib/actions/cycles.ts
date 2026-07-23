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
