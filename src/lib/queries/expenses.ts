/**
 * expenses.ts — reads the rows a cycle's spending is made of, then hands them to
 * {@link groupCycleExpenses} to become the itemised table (A-47).
 *
 * A caller that already holds those rows — a finished cycle's page reads them for
 * its own figures — calls the calculation directly instead of coming through here.
 */
import { createClient } from "@/lib/supabase/server";
import {
  groupCycleExpenses,
  type CycleExpenses,
} from "@/lib/calculations/expenses";

export type {
  CycleExpenses,
  ExpenseGroup,
  ExpenseLine,
} from "@/lib/calculations/expenses";

/** The columns the breakdown needs off a cycle's `expense` rows. */
export const EXPENSE_COLUMNS = "category, description, amount, quantity, unit_price";

/** A cycle's spending, itemised and grouped (A-47). */
export async function getCycleExpenses(
  cycleId: string,
): Promise<CycleExpenses> {
  const supabase = await createClient();

  const [cycleRes, feedRes, expenseRes] = await Promise.all([
    supabase
      .from("cycle")
      .select("chick_count, chick_price")
      .eq("id", cycleId)
      .maybeSingle(),
    supabase
      .from("feed")
      .select("bags, bag_price, phase")
      .eq("cycle_id", cycleId)
      .order("purchased_on", { ascending: true }),
    supabase
      .from("expense")
      .select(EXPENSE_COLUMNS)
      .eq("cycle_id", cycleId)
      .order("spent_on", { ascending: true }),
  ]);

  return groupCycleExpenses({
    chickCount: cycleRes.data?.chick_count ?? 0,
    chickPrice: Number(cycleRes.data?.chick_price ?? 0),
    feed: (feedRes.data ?? []).map((row) => ({
      ...row,
      bag_price: Number(row.bag_price),
    })),
    expenses: (expenseRes.data ?? []).map((row) => ({
      ...row,
      amount: Number(row.amount),
      quantity: row.quantity != null ? Number(row.quantity) : null,
      unit_price: row.unit_price != null ? Number(row.unit_price) : null,
    })),
  });
}
