/**
 * Cycle reads the customer needs: whether the sale is open right now, and the
 * instant the countdown on the home screen points at (FR-25).
 */
import { differenceInCalendarDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import {
  chickAgeDays,
  cycleAccounting,
  expectedSaleDate,
  type CycleEstimateBasis,
} from "@/lib/calculations/cycle";
import {
  expectedFeedBags,
  feedBagsAvailable,
  feedBagsWithdrawn,
  feedCost,
  purchasedBagsByPhase,
} from "@/lib/calculations/feed";
import { CYCLE_TOTAL_DAYS, SALE_READY_MIN_DAY } from "@/lib/constants";
import { getFarmSettings } from "@/lib/queries/settings";

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

/** Which stage of its life the active cycle is in — drives the admin home. */
export type CyclePhase = "raising" | "selling" | "ended";

/** One opened feed bag, with everything the bag-detail popup (A-13) shows. */
export interface FeedWithdrawal {
  /** Day offset (0-based, from the start date) — its cell on the grid. */
  dayOffset: number;
  /** 1-based order of this bag across the whole cycle (الشكارة رقم N). */
  bagNumber: number;
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
  feed: {
    /** Expected bags for the whole cycle — starter / grower (بادي / نامي). */
    requiredBadi: number;
    requiredNami: number;
    /** Bags still in the store (bought − withdrawn). */
    available: number;
    /** Bags bought so far this cycle, per phase — what's already in the store. */
    purchasedBadi: number;
    purchasedNami: number;
    /** Bags withdrawn/consumed so far. */
    withdrawn: number;
    /** Price of the last bag bought — pre-fills the purchase form. Null = never bought. */
    lastBagPrice: number | null;
    /** Cells in the consumption grid — one per cycle day (~40). */
    totalDays: number;
    /** Full detail per opened bag, chronological — lights the grid + feeds the popup. */
    withdrawals: FeedWithdrawal[];
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
      "id, name, chick_count, chick_price, start_date, start_time, sale_open, ended_at",
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
        .select("bags, withdrawn_on, withdrawn_at, created_at")
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

  const { badi, nami } = expectedFeedBags(cycle.chick_count);
  const purchased = purchasedBagsByPhase(feed, badi);

  // Classify each opened bag: the first `badiBagCount` bags (chronologically) are
  // بادي, the rest نامي — Khaled's FIFO rule (بادي is opened until it runs out,
  // then نامي). `bagNumber` is the bag's 1-based order across the whole cycle.
  const badiBagCount = Math.round(badi);
  let bagsSoFar = 0;
  const withdrawalList = withdrawals.map((w) => {
    const bagNumber = bagsSoFar + 1;
    bagsSoFar += w.bags;
    return {
      dayOffset: differenceInCalendarDays(
        new Date(w.withdrawn_on),
        new Date(cycle.start_date),
      ),
      bagNumber,
      phase: (bagNumber <= badiBagCount ? "badi" : "nami") as "badi" | "nami",
      ageDays: chickAgeDays(cycle.start_date, new Date(w.withdrawn_on)),
      withdrawnOn: w.withdrawn_on,
      withdrawnAt: w.withdrawn_at,
    };
  });
  // A bag opened before day 1 has no grid cell — hide it (the action blocks this,
  // but seed/legacy rows might not).
  const withdrawalDetails = withdrawalList.filter((w) => w.dayOffset >= 0);

  // Which cycle days a bag was opened on — one lit square per day on the grid.
  const withdrawalDays = withdrawalDetails.map((w) => w.dayOffset);
  const totalDays = Math.max(
    CYCLE_TOTAL_DAYS,
    ...withdrawalDays.map((d) => d + 1),
  );

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
    feed: {
      requiredBadi: badi,
      requiredNami: nami,
      available: feedBagsAvailable(feed, withdrawals),
      purchasedBadi: purchased.badi,
      purchasedNami: purchased.nami,
      withdrawn: feedBagsWithdrawn(withdrawals),
      lastBagPrice,
      totalDays,
      withdrawals: withdrawalDetails,
    },
  };
}

/** The cycle the orders screen is scoped to — the header of that screen's data. */
export interface OrdersCycle {
  cycleId: string;
  /** The cycle's own number (1, 2, 3 …) — the first digit of every order number. */
  seq: number;
  name: string | null;
  startDate: string;
  /** True while this is the farm's running cycle (nothing has ended it yet). */
  isActive: boolean;
}

/**
 * The cycle the orders screen (A-50) shows by default: the running cycle if
 * there is one, otherwise the most recent cycle that ended — so the admin always
 * lands on the orders that still matter to him. Null for a farm with no cycles.
 *
 * The funnel filter on that screen will let him pick any other cycle; when it
 * lands, it only supplies the id and this stays the fallback.
 */
export async function getDefaultOrdersCycle(
  farmId: string,
): Promise<OrdersCycle | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cycle")
    .select("id, seq, name, start_date, is_active")
    // Active first, then newest — one row, no second query for the fallback.
    .eq("farm_id", farmId)
    .order("is_active", { ascending: false })
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  return {
    cycleId: data.id,
    seq: data.seq,
    name: data.name,
    startDate: data.start_date,
    isActive: data.is_active,
  };
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
