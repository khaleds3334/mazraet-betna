/**
 * Cycle reads the customer needs: whether the sale is open right now, and the
 * instant the countdown on the home screen points at (FR-25).
 */
import { createClient } from "@/lib/supabase/server";
import { expectedSaleDate } from "@/lib/calculations/cycle";

export interface SaleState {
  saleOpen: boolean;
  /** ISO instant the countdown targets, or null when there's nothing to count to. */
  targetDate: string | null;
}

/**
 * Sale state of the farm's active cycle:
 *   • sale open  → count down to when the sale window closes (`sale_closes_at`).
 *   • sale closed → count down to the expected sale start (start + raising period).
 * Returns null when the farm has no active cycle.
 */
export async function getActiveSaleState(
  farmId: string,
): Promise<SaleState | null> {
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("cycle")
    .select("sale_open, sale_closes_at, start_date")
    .eq("farm_id", farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle) return null;

  if (cycle.sale_open) {
    return { saleOpen: true, targetDate: cycle.sale_closes_at };
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("raising_period_days")
    .eq("farm_id", farmId)
    .maybeSingle();

  const target = expectedSaleDate(
    cycle.start_date,
    settings?.raising_period_days,
  );
  return { saleOpen: false, targetDate: target.toISOString() };
}

/**
 * Whether the farm has an active cycle right now. The admin home shows the
 * first-time empty state (A-10) when there is none, and the running-cycle
 * dashboard once one exists (only one cycle can be active per farm — FR-4).
 */
export async function hasActiveCycle(farmId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cycle")
    .select("id")
    .eq("farm_id", farmId)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Whether the farm has ever registered a cycle (active or ended). The cycles
 * screen shows the empty state (A-40) only when there's none at all — once any
 * cycle exists it shows the list (A-42).
 */
export async function hasAnyCycle(farmId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("cycle")
    .select("id", { count: "exact", head: true })
    .eq("farm_id", farmId);
  return (count ?? 0) > 0;
}
