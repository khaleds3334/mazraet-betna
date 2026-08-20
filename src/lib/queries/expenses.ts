/**
 * expenses.ts — a cycle's spending, itemised (A-47). The dashboards show one
 * number, «مصاريف الدورة»; this is that number opened up, so the admin can see
 * where it went without leaving the screen he was on.
 *
 * The same arithmetic `cycleAccounting` sums into `expensesTotal` (FR-19), only
 * kept apart by kind instead of added up — so the table always reconciles with
 * the tile that opened it.
 */
import { createClient } from "@/lib/supabase/server";
import { FEED_PHASE_LABEL } from "@/lib/constants";

/** One row of the table: what it was, how many, at what price. */
export interface ExpenseLine {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/** A block of rows with its own bold subtotal underneath. */
export interface ExpenseGroup {
  key: "chicks" | "feed" | "medicine" | "utilities" | "other";
  /** The subtotal's caption — «اجمالي سعر العلف». */
  totalLabel: string;
  lines: ExpenseLine[];
  total: number;
}

export interface CycleExpenses {
  /** Only the groups the cycle actually spent on, in the design's order. */
  groups: ExpenseGroup[];
  total: number;
}

/** Group order and captions, exactly as the design lists them. */
const GROUPS: { key: ExpenseGroup["key"]; totalLabel: string }[] = [
  { key: "chicks", totalLabel: "اجمالي سعر الكتاكيت" },
  { key: "feed", totalLabel: "اجمالي سعر العلف" },
  { key: "medicine", totalLabel: "اجمالي سعر الادوية" },
  { key: "utilities", totalLabel: "اجمالي سعر المياه و الكهرباء" },
  { key: "other", totalLabel: "اجمالي سعر المصاريف الاخري" },
];

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Every pound a cycle spent, itemised and grouped (A-47).
 *
 * Three sources, because that is how the money was recorded: the chicks are two
 * columns on the cycle itself, feed is its own table (bags × the price of that
 * purchase), and everything else is an `expense` row.
 *
 * A manual expense carries its own quantity and unit price since migration 015 —
 * three bottles of medicine at ٨٠, or the kilowatt-hours between two meter
 * readings. Rows recorded before that have neither, and fall back to **one at its
 * own price**, which is exactly what they were.
 */
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
      .select("bags, bag_price, phase, purchased_on")
      .eq("cycle_id", cycleId)
      .order("purchased_on", { ascending: true }),
    supabase
      .from("expense")
      .select("category, description, amount, quantity, unit_price, spent_on")
      .eq("cycle_id", cycleId)
      .order("spent_on", { ascending: true }),
  ]);

  const lines = new Map<ExpenseGroup["key"], ExpenseLine[]>(
    GROUPS.map((group) => [group.key, []]),
  );

  const cycle = cycleRes.data;
  if (cycle && cycle.chick_count > 0) {
    const unitPrice = Number(cycle.chick_price);
    lines.get("chicks")!.push({
      label: "كتاكيت",
      quantity: cycle.chick_count,
      unitPrice,
      total: round2(cycle.chick_count * unitPrice),
    });
  }

  for (const feed of feedRes.data ?? []) {
    if (feed.bags <= 0) continue;
    const unitPrice = Number(feed.bag_price);
    lines.get("feed")!.push({
      label: feed.phase ? `علف ${FEED_PHASE_LABEL[feed.phase]}` : "علف",
      quantity: feed.bags,
      unitPrice,
      total: round2(feed.bags * unitPrice),
    });
  }

  for (const expense of expenseRes.data ?? []) {
    const amount = Number(expense.amount);
    // A feed row filed under `expense` is still feed money — it belongs with the
    // bags, not in a group of its own, or the table would stop adding up to the
    // tile that opened it.
    const key: ExpenseGroup["key"] =
      expense.category === "feed" ? "feed" : expense.category;
    // The row's own breakdown when it has one (migration 015), otherwise one at
    // its own price. `total` always comes from `amount`, never from the product:
    // the amount is what was paid, and a rounded unit price must not move it.
    const quantity = expense.quantity != null ? Number(expense.quantity) : 1;
    lines.get(key)!.push({
      label: expense.description?.trim() || GROUP_FALLBACK[key],
      quantity,
      unitPrice:
        expense.unit_price != null ? Number(expense.unit_price) : amount,
      total: round2(amount),
    });
  }

  const groups = GROUPS.map((group) => {
    const groupLines = lines.get(group.key)!;
    return {
      ...group,
      lines: groupLines,
      total: round2(groupLines.reduce((sum, line) => sum + line.total, 0)),
    };
  }).filter((group) => group.lines.length > 0);

  return {
    groups,
    total: round2(groups.reduce((sum, group) => sum + group.total, 0)),
  };
}

/** What a row is called when it was saved without a description. */
const GROUP_FALLBACK: Record<ExpenseGroup["key"], string> = {
  chicks: "كتاكيت",
  feed: "علف",
  medicine: "أدوية",
  utilities: "مياه وكهرباء",
  other: "مصروف",
};
