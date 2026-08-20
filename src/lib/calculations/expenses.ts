/**
 * expenses.ts — a cycle's spending, kept apart by kind instead of added up (A-47).
 *
 * Pure: it takes the rows and returns the table. Two callers read those rows for
 * different reasons — the sheet on a dashboard, and a finished cycle's page, which
 * already has them in hand — and neither should be reading them twice or carrying
 * its own copy of the grouping rules.
 *
 * The result always reconciles with `cycleAccounting().expensesTotal` (FR-19):
 * same arithmetic, different shape.
 */
import { FEED_PHASE_LABEL, type ExpenseCategory, type FeedPhase } from "@/lib/constants";

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

/** The rows a cycle's spending is assembled from. */
export interface CycleExpenseInput {
  chickCount: number;
  chickPrice: number;
  feed: { bags: number; bag_price: number; phase: FeedPhase | null }[];
  expenses: {
    category: ExpenseCategory;
    description: string | null;
    amount: number;
    quantity: number | null;
    unit_price: number | null;
  }[];
}

/** Group order and captions, exactly as the design lists them. */
const GROUPS: { key: ExpenseGroup["key"]; totalLabel: string }[] = [
  { key: "chicks", totalLabel: "اجمالي سعر الكتاكيت" },
  { key: "feed", totalLabel: "اجمالي سعر العلف" },
  { key: "medicine", totalLabel: "اجمالي سعر الادوية" },
  { key: "utilities", totalLabel: "اجمالي سعر المياه و الكهرباء" },
  { key: "other", totalLabel: "اجمالي سعر المصاريف الاخري" },
];

/** What a row is called when it was saved without a description. */
const GROUP_FALLBACK: Record<ExpenseGroup["key"], string> = {
  chicks: "كتاكيت",
  feed: "علف",
  medicine: "أدوية",
  utilities: "مياه وكهرباء",
  other: "مصروف",
};

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
export function groupCycleExpenses(input: CycleExpenseInput): CycleExpenses {
  const lines = new Map<ExpenseGroup["key"], ExpenseLine[]>(
    GROUPS.map((group) => [group.key, []]),
  );

  if (input.chickCount > 0) {
    lines.get("chicks")!.push({
      label: "كتاكيت",
      quantity: input.chickCount,
      unitPrice: input.chickPrice,
      total: round2(input.chickCount * input.chickPrice),
    });
  }

  for (const feed of input.feed) {
    if (feed.bags <= 0) continue;
    lines.get("feed")!.push({
      label: feed.phase ? `علف ${FEED_PHASE_LABEL[feed.phase]}` : "علف",
      quantity: feed.bags,
      unitPrice: feed.bag_price,
      total: round2(feed.bags * feed.bag_price),
    });
  }

  for (const expense of input.expenses) {
    // A feed row filed under `expense` is still feed money — it belongs with the
    // bags, not in a group of its own, or the table would stop adding up to the
    // tile that opened it.
    const key: ExpenseGroup["key"] =
      expense.category === "feed" ? "feed" : expense.category;
    // The row's own breakdown when it has one (migration 015), otherwise one at
    // its own price. `total` always comes from `amount`, never from the product:
    // the amount is what was paid, and a rounded unit price must not move it.
    lines.get(key)!.push({
      label: expense.description?.trim() || GROUP_FALLBACK[key],
      quantity: expense.quantity ?? 1,
      unitPrice: expense.unit_price ?? expense.amount,
      total: round2(expense.amount),
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
