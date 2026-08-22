import { createClient } from "@/lib/supabase/server";
import { countAvailableChickens } from "@/lib/queries/selling";

/**
 * Put the sale back when birds come back to a flock that sold out.
 *
 * A sale closed by the flock running out (`sale_auto_closed`) is the one close
 * the admin never made, so it must not be his to undo — he would have to notice
 * a cancelled order and remember to flip a switch he never pressed. This is what
 * undoes it (Khaled, 2026-08-22).
 *
 * **Call it from anything that hands birds back**, not just from cancelling: a
 * bird removed at the scale (FR-14ج) returns to the flock exactly as a cancelled
 * order's do. That is why it lives here rather than inside `cancelOrder` — one
 * function to call, instead of a rule every future writer has to remember.
 *
 * It never touches a sale the admin closed himself: that one stays shut until he
 * opens it, birds or no birds.
 */
export async function reopenSaleIfBirdsReturned(cycleId: string): Promise<void> {
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("cycle")
    .select("id, chick_count, sale_open, sale_auto_closed, is_active")
    .eq("id", cycleId)
    .maybeSingle();

  if (!cycle || !cycle.is_active) return;
  if (cycle.sale_open || !cycle.sale_auto_closed) return;

  const available = await countAvailableChickens(cycle.id, cycle.chick_count);
  if (available <= 0) return;

  await supabase
    .from("cycle")
    .update({
      sale_open: true,
      sale_auto_closed: false,
      // Selling did not end after all.
      selling_ended_at: null,
    })
    .eq("id", cycle.id);
}
