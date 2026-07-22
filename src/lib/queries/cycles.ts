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
