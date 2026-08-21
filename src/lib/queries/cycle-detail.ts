/**
 * cycle-detail.ts — everything one finished cycle's page shows (A-45).
 *
 * Its own file rather than another export on `cycles.ts`: this is the only read
 * that wants a cycle *whole* — the money, the flock, the feed calendar and the
 * weight spread together — and it is scoped to a single id, where every read in
 * `cycles.ts` is scoped to a farm.
 */
import { createClient } from "@/lib/supabase/server";
import {
  averageChickenWeight,
  cycleAccounting,
  cycleDurationDays,
  weightDistribution,
  type WeightBand,
} from "@/lib/calculations/cycle";
import {
  groupCycleExpenses,
  type CycleExpenses,
} from "@/lib/calculations/expenses";
import { feedCost } from "@/lib/calculations/feed";
import { sumInvoices } from "@/lib/calculations/invoice";
import {
  buildFeedSummary,
  getLastFeedBagPrice,
  type CycleDashboard,
  type CyclePhase,
} from "@/lib/queries/cycles";
import { EXPENSE_COLUMNS } from "@/lib/queries/expenses";

export interface CycleDetail {
  cycleId: string;
  seq: number;
  name: string | null;
  startDate: string;
  endedAt: string | null;
  phase: CyclePhase;
  chickCount: number;
  durationDays: number;
  mortalityCount: number;
  /** Everything the cycle invoiced — «اجمالي الدخل». */
  income: number;
  expensesTotal: number;
  /** Income minus every cost — «صافي الربح». */
  netProfit: number;
  /** Still owed by customers on this cycle (FR-20). */
  debt: number;
  /** Mean weight of every bird actually weighed, in kg. */
  averageWeight: number;
  /** Orders placed on this cycle, cancelled ones excluded. */
  orderCount: number;
  feed: CycleDashboard["feed"];
  /** The flock sorted into the four weight bands (FR-24). */
  weights: WeightBand[];
  /** The spend itemised, for the sheet behind the expenses tile (A-47). It is
   *  built from rows this read already has — asking `getCycleExpenses` for it
   *  would fetch the cycle, its feed and its expenses a second time. */
  expenses: CycleExpenses;
}

/**
 * One cycle, whole (A-45). Returns null when the id is not this farm's — the page
 * turns that into a 404 rather than an empty screen that implies the cycle exists.
 *
 * Six reads in parallel, then all the arithmetic through `/lib/calculations`, so
 * the figures here and the ones on the cycles list are the same numbers by
 * construction rather than by coincidence.
 */
export async function getCycleDetail(
  farmId: string,
  cycleId: string,
): Promise<CycleDetail | null> {
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("cycle")
    .select(
      "id, seq, name, chick_count, chick_price, start_date, is_active, sale_open, ended_at",
    )
    .eq("id", cycleId)
    .eq("farm_id", farmId)
    .maybeSingle();
  if (!cycle) return null;

  const [mortalityRes, expenseRes, feedRes, withdrawalRes, orderRes, lastBagPrice] =
    await Promise.all([
      supabase.from("mortality").select("count").eq("cycle_id", cycleId),
      supabase
        .from("expense")
        .select(EXPENSE_COLUMNS)
        .eq("cycle_id", cycleId)
        .order("spent_on", { ascending: true }),
      supabase
        .from("feed")
        .select("bags, bag_price, phase")
        .eq("cycle_id", cycleId),
      supabase
        .from("feed_withdrawal")
        .select("bags, phase, withdrawn_on, withdrawn_at, created_at")
        .eq("cycle_id", cycleId)
        .order("withdrawn_on", { ascending: true })
        .order("withdrawn_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("orders")
        .select(
          "unit_price, cleaning_price, order_line(id, batch_no, position, actual_weight, cleaning), payment(amount)",
        )
        .eq("cycle_id", cycleId)
        .neq("status", "cancelled"),
      getLastFeedBagPrice(farmId),
    ]);

  const feed = (feedRes.data ?? []).map((row) => ({
    ...row,
    bag_price: Number(row.bag_price),
  }));
  const expenses = (expenseRes.data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
    quantity: row.quantity != null ? Number(row.quantity) : null,
    unit_price: row.unit_price != null ? Number(row.unit_price) : null,
  }));
  const orders = orderRes.data ?? [];

  const money = sumInvoices(
    orders.map((order) => ({
      order,
      lines: order.order_line ?? [],
      payments: order.payment ?? [],
    })),
  );

  const { expensesTotal, netProfit } = cycleAccounting({
    salesTotal: money.income,
    chickCount: cycle.chick_count,
    chickPrice: Number(cycle.chick_price),
    feedCost: feedCost(feed),
    otherExpenses: expenses.reduce((sum, row) => sum + row.amount, 0),
  });

  // Every weight that actually went on the scale, once — the average and the
  // bands are two readings of the same list.
  const weighed = orders.flatMap((order) =>
    (order.order_line ?? [])
      .filter((line) => line.actual_weight != null)
      .map((line) => Number(line.actual_weight)),
  );

  return {
    cycleId: cycle.id,
    seq: cycle.seq ?? 0,
    name: cycle.name,
    startDate: cycle.start_date,
    endedAt: cycle.ended_at,
    phase: !cycle.is_active || cycle.ended_at
      ? "ended"
      : cycle.sale_open
        ? "selling"
        : "raising",
    chickCount: cycle.chick_count,
    durationDays: cycleDurationDays(cycle.start_date, cycle.ended_at),
    mortalityCount: (mortalityRes.data ?? []).reduce(
      (sum, row) => sum + row.count,
      0,
    ),
    income: money.income,
    expensesTotal,
    netProfit,
    debt: money.debt,
    averageWeight: averageChickenWeight(weighed),
    orderCount: orders.length,
    feed: buildFeedSummary({
      startDate: cycle.start_date,
      chickCount: cycle.chick_count,
      feed,
      withdrawals: withdrawalRes.data ?? [],
      lastBagPrice,
    }),
    weights: weightDistribution(weighed),
    expenses: groupCycleExpenses({
      chickCount: cycle.chick_count,
      chickPrice: Number(cycle.chick_price),
      feed,
      expenses,
    }),
  };
}
