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
} from "@/lib/calculations/cycle";
import {
  expectedFeedBags,
  feedBagsAvailable,
  feedBagsWithdrawn,
  feedCost,
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
    /** Bags withdrawn/consumed so far. */
    withdrawn: number;
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

  const [mortalityRes, expenseRes, feedRes, withdrawalRes, settings] =
    await Promise.all([
      supabase.from("mortality").select("count").eq("cycle_id", cycle.id),
      supabase.from("expense").select("amount").eq("cycle_id", cycle.id),
      supabase.from("feed").select("bags, bag_price").eq("cycle_id", cycle.id),
      supabase
        .from("feed_withdrawal")
        .select("bags, withdrawn_on, withdrawn_at, created_at")
        .eq("cycle_id", cycle.id)
        .order("withdrawn_on", { ascending: true })
        .order("withdrawn_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      getFarmSettings(farmId),
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
      withdrawn: feedBagsWithdrawn(withdrawals),
      totalDays,
      withdrawals: withdrawalDetails,
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
