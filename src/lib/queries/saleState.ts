import { createClient } from "@/lib/supabase/server";
import { isSellingPhase } from "@/lib/cyclePhase";
import { countAvailableChickens } from "@/lib/queries/selling";

/**
 * Bring the sale into line with what is actually left of the flock — **in both
 * directions**, and from every path that can move the number.
 *
 * Birds leave the flock two ways and come back two ways, and the first version
 * of this only knew about one of each: an order took the last bird and closed
 * the sale, a cancelled order gave it back and reopened it. Recording a bird as
 * dead took the flock to zero and left «البيع متوفر» standing (Khaled,
 * 2026-08-22). Two half-rules where one rule was needed.
 *
 * **Call this from anything that changes «الفراخ المتوفرة»** — booking an order,
 * cancelling one, removing a bird at the scale (FR-14ج), recording mortality,
 * and whatever comes next. That is the whole reason it is one function: a stored
 * state drifts away from the flock the moment a writer forgets, and the writer
 * who forgets is always the one added later.
 *
 * ## What it will and will not touch
 *
 * - **Open, and nothing left** → closed, marked `sale_auto_closed`, and
 *   `selling_ended_at` stamped. The flock closed it, not the admin, so he cannot
 *   reopen it by hand (FR-11).
 * - **Auto-closed, and birds are back** → open again, on its own. That close was
 *   never his to undo.
 * - **Closed by the admin himself** → left exactly as it is, birds or no birds.
 *   His decision stands until he changes it; the flock does not get a vote on a
 *   switch he turned off.
 */
export async function syncSaleWithFlock(cycleId: string): Promise<void> {
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("cycle")
    .select(
      "id, chick_count, is_active, sale_open, sale_auto_closed, selling_started_at",
    )
    .eq("id", cycleId)
    .maybeSingle();

  if (!cycle || !cycle.is_active) return;
  // A flock still being raised has no sale to bring into line.
  if (!isSellingPhase(cycle)) return;

  // Nothing to decide unless the sale is open, or closed by the flock. A sale the
  // admin closed is his.
  if (!cycle.sale_open && !cycle.sale_auto_closed) return;

  const available = await countAvailableChickens(cycle.id, cycle.chick_count);

  if (cycle.sale_open && available <= 0) {
    await supabase
      .from("cycle")
      .update({
        sale_open: false,
        sale_auto_closed: true,
        selling_ended_at: new Date().toISOString(),
      })
      .eq("id", cycle.id);
    return;
  }

  if (cycle.sale_auto_closed && available > 0) {
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
}
