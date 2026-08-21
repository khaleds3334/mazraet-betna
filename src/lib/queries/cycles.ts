/**
 * Cycle reads the customer needs: whether the sale is open right now, and the
 * instant the countdown on the home screen points at (FR-25).
 */
import { differenceInCalendarDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import {
  averageChickenWeight,
  chickAgeDays,
  cycleAccounting,
  cycleDurationDays,
  daysSince,
  expectedSaleDate,
  rollingSaleStartDate,
  type CycleEstimateBasis,
} from "@/lib/calculations/cycle";
import {
  sumInvoices,
  type OrderInvoiceInput,
} from "@/lib/calculations/invoice";
import {
  expectedFeedBags,
  feedBagsAvailable,
  feedBagsWithdrawn,
  feedCost,
  bagsByPhase,
} from "@/lib/calculations/feed";
import {
  CYCLE_TOTAL_DAYS,
  SALE_READY_MIN_DAY,
  type FeedPhase,
} from "@/lib/constants";
import { getFarmSettings } from "@/lib/queries/settings";

export interface SaleState {
  saleOpen: boolean;
  /** ISO instant the countdown targets, or null when there's nothing to count to. */
  targetDate: string | null;
}

/**
 * What the customer's home counts down to (FR-25), in the order the farm can
 * actually answer it:
 *
 *   • a cycle is selling  → the end of the window (`sale_closes_at`);
 *   • a cycle is raising  → its own sale date (start + raising period);
 *   • no cycle at all     → the admin's date from A-70, and only if he has not
 *     set one, the rolling estimate off the last cycle to end.
 *
 * `saleOpen` stays false in every case but the first, so closing the sale from
 * settings takes orders down without touching the cycle: the toggle writes
 * `sale_open`, and the customer's home reads it from here.
 *
 * Returns null only when the farm has never had a cycle and no date is set —
 * there is genuinely nothing to promise, and the home says so rather than
 * counting down to a date nobody chose.
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

  const { data: settings } = await supabase
    .from("settings")
    .select("raising_period_days, sale_starts_at")
    .eq("farm_id", farmId)
    .maybeSingle();

  if (cycle) {
    if (cycle.sale_open) {
      return { saleOpen: true, targetDate: cycle.sale_closes_at };
    }
    const target = expectedSaleDate(
      cycle.start_date,
      settings?.raising_period_days,
    );
    return { saleOpen: false, targetDate: target.toISOString() };
  }

  // Between cycles. The admin's own date wins — he may know when the next
  // chicks arrive long before he registers them.
  if (settings?.sale_starts_at) {
    return { saleOpen: false, targetDate: settings.sale_starts_at };
  }

  const { data: lastEnded } = await supabase
    .from("cycle")
    .select("ended_at")
    .eq("farm_id", farmId)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lastEnded?.ended_at) return null;

  return {
    saleOpen: false,
    targetDate: rollingSaleStartDate(lastEnded.ended_at).toISOString(),
  };
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

/** Which stage of its life the active cycle is in — drives the admin home. */
export type CyclePhase = "raising" | "selling" | "ended";

/** One opened feed bag, with everything the bag-detail popup (A-13) shows. */
export interface FeedWithdrawal {
  /** Day offset (0-based, from the start date) — its cell on the grid. */
  dayOffset: number;
  /** 1-based order of this bag across the whole cycle (الشكارة رقم N). */
  /** Its place **within its own feed** — بادي and نامي each count from ١ (D-45). */
  phaseIndex: number;
  /** How much came out this time: a whole 50kg bag, or half of one. */
  bags: number;
  /** For a half opening: which half of its bag it is. Null for a whole bag. */
  half: "first" | "second" | null;
  /** True once this opening takes the phase past what the cycle was estimated
   *  to need — the flock is eating more than the forecast allowed for. */
  beyondRequired: boolean;
  /** Every bag opened before this one, both feeds together. */
  eatenBefore: number;
  /** بادي while inside the cycle's required starter bags, then نامي (Khaled's rule). */
  phase: "badi" | "nami";
  /** Chick age (days) on the day the bag was opened. */
  ageDays: number;
  /** Day the bag was opened (ISO date). */
  withdrawnOn: string;
  /** Time it was opened (`HH:mm`) or null for older rows. */
  withdrawnAt: string | null;
}

export interface CycleDashboard {
  cycleId: string;
  /** The cycle's given name, e.g. "دورة يناير", or null if unnamed. */
  name: string | null;
  startDate: string;
  startTime: string | null;
  chickCount: number;
  ageDays: number;
  phase: CyclePhase;
  /** True once the birds have reached the selling age (age ≥ raising period). */
  saleReady: boolean;
  /** Live kilo price from settings — the open-sale dialog opens on it, and the
   *  selling dashboard shows it in the header badge (FR-26). */
  salePrice: number;
  /** Total birds lost so far (FR-23). */
  mortalityCount: number;
  /** Cycle expenses so far: chicks + feed + manual expenses (FR-19). */
  expensesTotal: number;
  /** What A-41 forecast this cycle would cost, kept from the day it was
   *  registered. Null for cycles created before migration 018 — no line to
   *  cross, so the expenses tile stays neutral (D-46). */
  estimatedExpenses: number | null;
  feed: {
    /** Expected bags for the whole cycle — starter / grower (بادي / نامي). */
    requiredBadi: number;
    requiredNami: number;
    /** Bags still in the store (bought − withdrawn). */
    available: number;
    /** The same, per feed — the two piles are counted apart (D-43). */
    availableBadi: number;
    availableNami: number;
    /** Bags bought so far this cycle, per phase — what's already in the store. */
    purchasedBadi: number;
    purchasedNami: number;
    /** Bags withdrawn/consumed so far. */
    withdrawn: number;
    /** Of those, how many were بادي and how many نامي — what is actually left of
     *  each in the store, and what the next bag defaults to (A-13). */
    withdrawnBadi: number;
    withdrawnNami: number;
    /** Price of the last bag bought — pre-fills the purchase form. Null = never bought. */
    lastBagPrice: number | null;
    /** Cells in the consumption grid — one per cycle day (~40). */
    totalDays: number;
    /** Full detail per opened bag, chronological — lights the grid + feeds the popup. */
    withdrawals: FeedWithdrawal[];
  };
}

/** The raw rows the feed summary is built from. */
interface FeedInput {
  startDate: string;
  chickCount: number;
  feed: { bags: number; bag_price: number; phase: FeedPhase | null }[];
  withdrawals: {
    bags: number;
    phase: FeedPhase | null;
    withdrawn_on: string;
    withdrawn_at: string | null;
  }[];
  /** Farm-level, so the caller supplies it. Null = no bag ever bought. */
  lastBagPrice: number | null;
}

/**
 * The feed store of one cycle: what it needs, what is in it, what has been opened,
 * and the calendar of openings behind the consumption grid.
 *
 * Shared by the running dashboard (A-11) and a finished cycle's page (A-45), which
 * draw the same grid from the same rows — the bag-classification rule below is
 * subtle enough that two copies of it would eventually disagree.
 */
export function buildFeedSummary(input: FeedInput): CycleDashboard["feed"] {
  const { badi, nami } = expectedFeedBags(input.chickCount);
  const purchased = bagsByPhase(input.feed, badi);
  const withdrawnByPhase = bagsByPhase(input.withdrawals, badi);

  // Each opened bag says which feed it was (migration 017). Rows older than that
  // carry no phase, and fall back to the rule the app used before the column
  // existed: bags are بادي until the cycle's بادي requirement is used up, then
  // نامي.
  //
  // Two running totals, because the farm counts two things (D-45): `bagsSoFar` is
  // everything opened, which is what «أكلوا قبلها» reports; `perPhase` is each
  // feed on its own, which is what names the bag. `floor` is what makes two halves
  // of the same bag share its ordinal — «نصف الشكارة الثانية», twice — instead of
  // the second half claiming to be a third bag.
  let bagsSoFar = 0;
  const perPhase: Record<FeedPhase, number> = { badi: 0, nami: 0 };

  const withdrawalList = input.withdrawals.map((w) => {
    const phase: FeedPhase = w.phase ?? (bagsSoFar < badi ? "badi" : "nami");
    const eatenBefore = bagsSoFar;
    const openedOfPhase = perPhase[phase];
    const phaseIndex = Math.floor(openedOfPhase) + 1;

    // Which half of its bag this is: one that lands on a whole number starts a
    // bag, one that lands on a half finishes the bag before it.
    const half: FeedWithdrawal["half"] =
      w.bags === 0.5 ? (openedOfPhase % 1 === 0.5 ? "second" : "first") : null;

    bagsSoFar += w.bags;
    perPhase[phase] += w.bags;

    return {
      half,
      beyondRequired: perPhase[phase] > (phase === "badi" ? badi : nami),
      dayOffset: differenceInCalendarDays(
        new Date(w.withdrawn_on),
        new Date(input.startDate),
      ),
      phaseIndex,
      bags: w.bags,
      eatenBefore,
      phase,
      ageDays: chickAgeDays(input.startDate, new Date(w.withdrawn_on)),
      withdrawnOn: w.withdrawn_on,
      withdrawnAt: w.withdrawn_at,
    };
  });
  // A bag opened before day 1 has no grid cell — hide it (the action blocks this,
  // but seed/legacy rows might not).
  const withdrawals = withdrawalList.filter((w) => w.dayOffset >= 0);

  return {
    requiredBadi: badi,
    requiredNami: nami,
    available: feedBagsAvailable(input.feed, input.withdrawals),
    availableBadi: Math.max(0, purchased.badi - withdrawnByPhase.badi),
    availableNami: Math.max(0, purchased.nami - withdrawnByPhase.nami),
    purchasedBadi: purchased.badi,
    purchasedNami: purchased.nami,
    withdrawn: feedBagsWithdrawn(input.withdrawals),
    withdrawnBadi: withdrawnByPhase.badi,
    withdrawnNami: withdrawnByPhase.nami,
    lastBagPrice: input.lastBagPrice,
    // The grid is at least a full cycle long, and stretches if a bag was opened
    // past day 40.
    totalDays: Math.max(
      CYCLE_TOTAL_DAYS,
      ...withdrawals.map((w) => w.dayOffset + 1),
    ),
    withdrawals,
  };
}

/**
 * Everything the running-cycle dashboard (A-11 raising / A-20 selling) shows for
 * the farm's active cycle, or null when there is none. Aggregates the cycle row
 * with its mortality, expenses, and feed (purchases + withdrawals) in one place
 * so the page stays a thin view. All the arithmetic lives in /lib/calculations.
 */
export async function getActiveCycleDashboard(
  farmId: string,
): Promise<CycleDashboard | null> {
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("cycle")
    .select(
      "id, name, chick_count, chick_price, start_date, start_time, sale_open, ended_at, estimated_expenses",
    )
    .eq("farm_id", farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle) return null;

  const [
    mortalityRes,
    expenseRes,
    feedRes,
    withdrawalRes,
    settings,
    lastBagPrice,
  ] = await Promise.all([
      supabase.from("mortality").select("count").eq("cycle_id", cycle.id),
      supabase.from("expense").select("amount").eq("cycle_id", cycle.id),
      supabase
        .from("feed")
        .select("bags, bag_price, phase")
        .eq("cycle_id", cycle.id),
      supabase
        .from("feed_withdrawal")
        .select("bags, phase, withdrawn_on, withdrawn_at, created_at")
        .eq("cycle_id", cycle.id)
        .order("withdrawn_on", { ascending: true })
        .order("withdrawn_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      getFarmSettings(farmId),
      getLastFeedBagPrice(farmId),
    ]);

  const ageDays = chickAgeDays(cycle.start_date);
  const feed = feedRes.data ?? [];
  const withdrawals = withdrawalRes.data ?? [];

  const mortalityCount = (mortalityRes.data ?? []).reduce(
    (sum, m) => sum + m.count,
    0,
  );
  const otherExpenses = (expenseRes.data ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );
  const { expensesTotal } = cycleAccounting({
    salesTotal: 0,
    chickCount: cycle.chick_count,
    chickPrice: Number(cycle.chick_price),
    feedCost: feedCost(
      feed.map((f) => ({ bags: f.bags, bag_price: Number(f.bag_price) })),
    ),
    otherExpenses,
  });

  const phase: CyclePhase = cycle.ended_at
    ? "ended"
    : cycle.sale_open
      ? "selling"
      : "raising";

  return {
    cycleId: cycle.id,
    name: cycle.name,
    startDate: cycle.start_date,
    startTime: cycle.start_time,
    chickCount: cycle.chick_count,
    ageDays,
    phase,
    saleReady: ageDays >= SALE_READY_MIN_DAY,
    salePrice: settings.salePrice,
    mortalityCount,
    expensesTotal,
    estimatedExpenses:
      cycle.estimated_expenses === null
        ? null
        : Number(cycle.estimated_expenses),
    feed: buildFeedSummary({
      startDate: cycle.start_date,
      chickCount: cycle.chick_count,
      feed,
      withdrawals,
      lastBagPrice,
    }),
  };
}

/** A cycle as the orders screen names it — its header, and its picker's rows. */
export interface OrdersCycle {
  cycleId: string;
  /** The cycle's own number (1, 2, 3 …) — the first digit of every order number. */
  seq: number;
  name: string | null;
  startDate: string;
  endedAt: string | null;
  /** True while this is the farm's running cycle (nothing has ended it yet). */
  isActive: boolean;
  /** True only while customers can order on it — the gate on booking (FR-11). */
  saleOpen: boolean;
  phase: CyclePhase;
}

/**
 * Every cycle the farm has run, newest first, reduced to what the orders screen
 * needs: the funnel picks one of these, and the chosen one scopes the list.
 *
 * Deliberately not `listCycles` — that one computes each cycle's money, and a
 * picker only needs their names.
 */
export async function listOrdersCycles(
  farmId: string,
): Promise<OrdersCycle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cycle")
    .select("id, seq, name, start_date, is_active, sale_open, ended_at")
    .eq("farm_id", farmId)
    .order("start_date", { ascending: false });

  return (data ?? []).map((cycle) => ({
    cycleId: cycle.id,
    seq: cycle.seq ?? 0,
    name: cycle.name,
    startDate: cycle.start_date,
    endedAt: cycle.ended_at,
    isActive: cycle.is_active,
    saleOpen: cycle.is_active && cycle.sale_open,
    phase: (!cycle.is_active || cycle.ended_at
      ? "ended"
      : cycle.sale_open
        ? "selling"
        : "raising") as CyclePhase,
  }));
}

/**
 * **«الدورة الحالية»** — the cycle every screen means when it says that word, in
 * one place so they cannot mean different things (Khaled, 2026-08-20):
 *
 *   1. the cycle **selling** right now, if there is one — that is where orders
 *      are being placed;
 *   2. otherwise the **last cycle to end** — during raising nobody is ordering,
 *      and what still matters is who owes for the flock just sold;
 *   3. otherwise whatever cycle exists at all — a farm's first cycle, still being
 *      raised, with no history behind it.
 *
 * Null only for a farm that has never registered one.
 *
 * The old rule was "active first, then newest", which pointed at a **raising**
 * cycle the moment one started — an empty orders screen and «طلبات الدورة: ٠» on
 * every customer, on the very day the previous cycle's debts still needed
 * chasing.
 *
 * Pure, so a screen that has already read the cycles for its picker doesn't read
 * them twice.
 */
export function pickDefaultCycle(cycles: OrdersCycle[]): OrdersCycle | null {
  return (
    cycles.find((cycle) => cycle.saleOpen) ??
    cycles.find((cycle) => cycle.endedAt) ??
    cycles.at(0) ??
    null
  );
}

/** {@link pickDefaultCycle} for a caller that only wants the one cycle. */
export async function getDefaultOrdersCycle(
  farmId: string,
): Promise<OrdersCycle | null> {
  return pickDefaultCycle(await listOrdersCycles(farmId));
}

/**
 * What the farm last paid for one 50kg bag, or null if it never bought one.
 * Farm-wide and newest-first, so it survives a cycle that bought no feed.
 *
 * Two screens want it and both want it for the same reason — the admin should
 * never have to retype a price the app already knows: it pre-fills the price
 * field when he records a purchase (A-15), and it prices the feed line of the
 * next cycle's forecast (A-41, T-46).
 *
 * `bag_price` is 0 when bags were recorded without a price; that's an absent
 * price, not a free bag, so those rows are skipped.
 */
export async function getLastFeedBagPrice(
  farmId: string,
): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feed")
    .select("bag_price")
    .eq("farm_id", farmId)
    .gt("bag_price", 0)
    .order("purchased_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? Number(data.bag_price) : null;
}

/**
 * The last cycle's real numbers, so the create-cycle sheet can forecast the next
 * one from this farm rather than from a constant (A-41, "المصاريف المتوقعة" —
 * see {@link estimatedCycleExpenses}). Two independent reads:
 *
 *   • the price of the most recent 50kg bag bought ({@link getLastFeedBagPrice});
 *   • the last cycle's non-feed, non-chick expenses, with the flock they were
 *     spent on so the caller can scale them.
 *
 * Feed lives in its own table, so summing `expense` here can't double-count it.
 * Returns nulls rather than defaults — deciding what to do without history is the
 * calculation's job, not the query's.
 */
export async function getCycleEstimateBasis(
  farmId: string,
): Promise<CycleEstimateBasis> {
  const supabase = await createClient();

  // A cycle can only be created while none is active, so the newest cycle on
  // record is "the last one" by the time this is read.
  const lastCycle = supabase
    .from("cycle")
    .select("id, chick_count")
    .eq("farm_id", farmId)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [feedBagPrice, cycleResult] = await Promise.all([
    getLastFeedBagPrice(farmId),
    lastCycle,
  ]);

  if (!cycleResult.data) return { feedBagPrice, previous: null };

  const { data: expenses } = await supabase
    .from("expense")
    .select("amount")
    .eq("cycle_id", cycleResult.data.id)
    // Feed is forecast from bags × bag price above. The UI files feed purchases
    // in the `feed` table, but the category exists on `expense` too — excluding
    // it here means a stray row can't be counted twice.
    .neq("category", "feed");

  const otherExpenses = (expenses ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0,
  );

  return {
    feedBagPrice,
    previous: {
      otherExpenses,
      chickCount: cycleResult.data.chick_count,
    },
  };
}


/** One row of the cycles list (A-42/A-43) — a whole cycle reduced to six figures. */
export interface CycleListItem {
  cycleId: string;
  /** The cycle's own number on this farm (١، ٢، ٣ …) — what the row is titled by. */
  seq: number;
  name: string | null;
  startDate: string;
  /** ISO instant the cycle was closed, or null while it is still running. */
  endedAt: string | null;
  phase: CyclePhase;
  chickCount: number;
  /** Days the cycle ran — closed: start → end; running: start → today. */
  durationDays: number;
  /** Days since it ended, or null while it is still running. */
  daysSinceEnd: number | null;
  mortalityCount: number;
  /** Chicks + feed + everything else spent on it (FR-19). */
  expensesTotal: number;
  /** Sales minus every cost. Only settled once the cycle has ended. */
  netProfit: number;
  /** What customers still owe on this cycle's orders (FR-20). */
  debt: number;
  /** Mean weight of every bird the cycle actually weighed, in kg. Zero before
   *  anything was weighed. Not shown on the list — the idle home charts it. */
  averageWeight: number;
}

/** Sum a set of rows into a per-cycle map, keyed by `cycle_id`. */
function tallyByCycle<T extends { cycle_id: string }>(
  rows: T[],
  value: (row: T) => number,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.cycle_id, (totals.get(row.cycle_id) ?? 0) + value(row));
  }
  return totals;
}

/**
 * Every cycle the farm has ever run, newest first — the cycles list (A-42). Each
 * row carries what that cycle cost, what it earned, what it lost, and what is
 * still owed on it.
 *
 * Read as five flat queries scoped to the farm and joined in memory rather than
 * one query per cycle: a farm accumulates a handful of cycles a year, so the
 * whole history is a few hundred rows, and this way the page costs the same
 * whether there are two cycles or twenty.
 *
 * Nothing here is stored pre-totalled (D-05) — money is recomputed from the
 * orders' own lines and payments every time, so a correction to a weight shows up
 * in the profit immediately.
 */
export async function listCycles(farmId: string): Promise<CycleListItem[]> {
  const supabase = await createClient();

  const { data: cycles } = await supabase
    .from("cycle")
    .select(
      "id, seq, name, chick_count, chick_price, start_date, is_active, sale_open, ended_at",
    )
    .eq("farm_id", farmId)
    .order("seq", { ascending: false });
  if (!cycles?.length) return [];

  const [mortalityRes, expenseRes, feedRes, orderRes] = await Promise.all([
    supabase.from("mortality").select("cycle_id, count").eq("farm_id", farmId),
    supabase.from("expense").select("cycle_id, amount").eq("farm_id", farmId),
    supabase
      .from("feed")
      .select("cycle_id, bags, bag_price")
      .eq("farm_id", farmId),
    supabase
      .from("orders")
      .select(
        "cycle_id, unit_price, cleaning_price, order_line(id, batch_no, position, actual_weight, cleaning), payment(amount)",
      )
      .eq("farm_id", farmId)
      // A cancelled order was never sold and was never owed (FR-15).
      .neq("status", "cancelled"),
  ]);

  const mortality = tallyByCycle(mortalityRes.data ?? [], (m) => m.count);
  const expenses = tallyByCycle(expenseRes.data ?? [], (e) => Number(e.amount));
  const feedSpend = tallyByCycle(feedRes.data ?? [], (f) =>
    feedCost([{ bags: f.bags, bag_price: Number(f.bag_price) }]),
  );

  // Orders grouped by cycle, then rolled into one money picture per cycle. The
  // same pass collects the weights that were actually put on the scale, since
  // the lines are already in hand.
  const ordersByCycle = new Map<string, OrderInvoiceInput[]>();
  const weightsByCycle = new Map<string, number[]>();
  for (const order of orderRes.data ?? []) {
    const lines = order.order_line ?? [];
    const bucket = ordersByCycle.get(order.cycle_id) ?? [];
    bucket.push({ order, lines, payments: order.payment ?? [] });
    ordersByCycle.set(order.cycle_id, bucket);

    const weights = weightsByCycle.get(order.cycle_id) ?? [];
    for (const line of lines) {
      if (line.actual_weight != null) weights.push(Number(line.actual_weight));
    }
    weightsByCycle.set(order.cycle_id, weights);
  }

  return cycles.map((cycle) => {
    const money = sumInvoices(ordersByCycle.get(cycle.id) ?? []);
    const { expensesTotal, netProfit } = cycleAccounting({
      salesTotal: money.income,
      chickCount: cycle.chick_count,
      chickPrice: Number(cycle.chick_price),
      feedCost: feedSpend.get(cycle.id) ?? 0,
      otherExpenses: expenses.get(cycle.id) ?? 0,
    });

    // A cycle is finished the moment it stops being the farm's active one — the
    // timestamp is the record of when, not the thing that decides it.
    const ended = !cycle.is_active || Boolean(cycle.ended_at);

    return {
      cycleId: cycle.id,
      seq: cycle.seq ?? 0,
      name: cycle.name,
      startDate: cycle.start_date,
      endedAt: cycle.ended_at,
      phase: ended ? "ended" : cycle.sale_open ? "selling" : "raising",
      chickCount: cycle.chick_count,
      durationDays: cycleDurationDays(cycle.start_date, cycle.ended_at),
      daysSinceEnd: cycle.ended_at ? daysSince(cycle.ended_at) : null,
      mortalityCount: mortality.get(cycle.id) ?? 0,
      expensesTotal,
      netProfit,
      debt: money.debt,
      averageWeight: averageChickenWeight(weightsByCycle.get(cycle.id) ?? []),
    };
  });
}
