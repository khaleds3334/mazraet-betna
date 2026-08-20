/**
 * cycle.ts — cycle-level numbers: chick age, the selling window, mortality,
 * the display temperature, and the final profit accounting (FR-4, 7, 19, 23).
 */
import { addDays, differenceInCalendarDays } from "date-fns";
import {
  ASSUMED_FEED_BAG_PRICE,
  RAISING_PERIOD_DAYS,
  WEEKLY_TEMPERATURE_C,
} from "@/lib/constants";
import { expectedFeedBags } from "@/lib/calculations/feed";

/** Age of the chicks in whole days since the cycle started (FR-7). */
export function chickAgeDays(startDate: Date | string, today: Date = new Date()): number {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  return Math.max(0, differenceInCalendarDays(today, start));
}

/** The date the birds are expected ready to sell: start + 30 days (FR-4). */
export function expectedSaleDate(
  startDate: Date | string,
  raisingPeriod: number = RAISING_PERIOD_DAYS,
): Date {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  return addDays(start, raisingPeriod);
}

/** Days left until the raising period ends. Zero once the window is reached (FR-7). */
export function daysUntilSaleReady(
  startDate: Date | string,
  raisingPeriod: number = RAISING_PERIOD_DAYS,
  today: Date = new Date(),
): number {
  return Math.max(0, raisingPeriod - chickAgeDays(startDate, today));
}

/** 1-based cycle week, used to look up the display temperature. */
export function cycleWeek(startDate: Date | string, today: Date = new Date()): number {
  return Math.floor(chickAgeDays(startDate, today) / 7) + 1;
}

/** Expected brooding temperature for the current week (FR-6, display only). */
export function expectedTemperature(startDate: Date | string, today: Date = new Date()): number {
  const index = Math.min(cycleWeek(startDate, today) - 1, WEEKLY_TEMPERATURE_C.length - 1);
  return WEEKLY_TEMPERATURE_C[index];
}

/** Live bird count = original chicks minus total mortality (FR-23). */
export function currentCount(chickCount: number, mortality: { count: number }[]): number {
  const died = mortality.reduce((sum, m) => sum + m.count, 0);
  return Math.max(0, chickCount - died);
}

/** Mortality rate as a fraction of the original flock (FR-23). */
export function mortalityRate(chickCount: number, mortality: { count: number }[]): number {
  if (chickCount <= 0) return 0;
  const died = mortality.reduce((sum, m) => sum + m.count, 0);
  return died / chickCount;
}

/**
 * Birds still free to sell — the "الفراخ المتوفرة" tile on the selling dashboard
 * (A-20). The flock minus the birds that died, the birds already handed over,
 * and the birds committed to orders that haven't been delivered yet. Committed
 * birds are subtracted so the admin never sells the same bird twice; this is the
 * number the sale's auto-close watches (FR-11).
 */
export function availableChickens(input: {
  chickCount: number;
  mortalityCount: number;
  /** Birds handed over to customers (delivered orders). */
  soldCount: number;
  /** Birds booked in orders that are still running (pending / weighed / ready). */
  requestedCount: number;
}): number {
  const committed = input.mortalityCount + input.soldCount + input.requestedCount;
  return Math.max(0, input.chickCount - committed);
}

/**
 * Mean actual weight of the birds weighed so far — "متوسط اوزان الدورة" (A-20).
 * Returns 0 before anything has been weighed, so the tile shows `٠.٠٠٠ كجم`
 * rather than NaN.
 */
export function averageChickenWeight(weights: number[]): number {
  if (weights.length === 0) return 0;
  const total = weights.reduce((sum, w) => sum + w, 0);
  return total / weights.length;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * What the last cycle actually cost, used to forecast the next one (see
 * {@link estimatedCycleExpenses}). Both halves are independently optional: a farm
 * can have bought feed without recording any other expense, and vice versa.
 */
export interface CycleEstimateBasis {
  /** Price of the most recently purchased 50kg bag. Null = none ever recorded. */
  feedBagPrice: number | null;
  /** Everything that wasn't chicks or feed on the last cycle, and the flock it fed. */
  previous: { otherExpenses: number; chickCount: number } | null;
}

export interface EstimatedCycleExpenses {
  /** Real: the two numbers the admin just typed. */
  chicks: number;
  /** Estimated: expected bags × the last bag price paid. */
  feed: number;
  /** Estimated: the last cycle's other expenses, scaled to this flock. */
  other: number;
  total: number;
  /** Total bags (بادي + نامي) the feed line was priced on. */
  bags: number;
  /** The per-bag price used — so the sheet can show what it multiplied by. */
  bagPrice: number;
  /** False when `bagPrice` is the fallback constant, not a bag he really bought. */
  bagPriceFromHistory: boolean;
}

/**
 * Forecast of what a cycle will cost, shown on the create-cycle sheet (A-41,
 * "المصاريف المتوقعة"). Only the chick cost is real — count × price, both typed
 * by the admin. The other two lines are read off the **last cycle**, because a
 * number from his own farm last month beats any constant we could pick:
 *
 *   • **Feed** — expected bags (FEED_PER_CHICK_KG) × the price of the last bag he
 *     actually bought. Bag prices move every few weeks, so a fixed price would be
 *     stale by the second cycle. Falls back to {@link ASSUMED_FEED_BAG_PRICE}
 *     only on the very first cycle, when there's no purchase to read.
 *   • **Everything else** (water, electricity, medicine…) — last cycle's total,
 *     scaled by flock size: `previous.otherExpenses × chickCount ÷ previous.chickCount`.
 *     Straight-line scaling treats every pound as if it were per-bird, which the
 *     electricity bill isn't; it still lands far closer than the 0 this line used
 *     to contribute. Zero until there's a finished cycle to read.
 *
 * Real expenses come from the feed/expense tables during the cycle — this never
 * feeds the profit accounting (see {@link cycleAccounting}).
 */
export function estimatedCycleExpenses(
  chickCount: number,
  chickPrice: number,
  basis?: CycleEstimateBasis,
): EstimatedCycleExpenses {
  const chicks = chickCount * chickPrice;

  const { badi, nami } = expectedFeedBags(chickCount);
  const bags = badi + nami;
  const bagPrice = basis?.feedBagPrice ?? ASSUMED_FEED_BAG_PRICE;
  const feed = bags * bagPrice;

  // Guard the divisor: a previous cycle registered with 0 chicks would otherwise
  // scale to Infinity, and the sheet would show a number the size of the farm.
  const previous = basis?.previous;
  const other =
    previous && previous.chickCount > 0
      ? (previous.otherExpenses * chickCount) / previous.chickCount
      : 0;

  return {
    chicks: round2(chicks),
    feed: round2(feed),
    other: round2(other),
    total: round2(chicks + feed + other),
    bags,
    bagPrice,
    bagPriceFromHistory: basis?.feedBagPrice != null,
  };
}

export interface CycleAccounting {
  salesTotal: number;
  chickCost: number;
  feedCost: number;
  otherExpenses: number;
  expensesTotal: number;
  netProfit: number;
}

/**
 * Final cycle accounting (FR-19): net profit = total sales − all costs.
 * Costs = chick purchase + feed + manual expenses. Shown live, not only at the end.
 * `salesTotal` is the sum of order invoices; feed/other come from their tables.
 */
export function cycleAccounting(input: {
  salesTotal: number;
  chickCount: number;
  chickPrice: number;
  feedCost: number;
  otherExpenses: number;
}): CycleAccounting {
  const chickCost = round2(input.chickCount * input.chickPrice);
  const feedCost = round2(input.feedCost);
  const otherExpenses = round2(input.otherExpenses);
  const expensesTotal = round2(chickCost + feedCost + otherExpenses);
  const salesTotal = round2(input.salesTotal);
  return {
    salesTotal,
    chickCost,
    feedCost,
    otherExpenses,
    expensesTotal,
    netProfit: round2(salesTotal - expensesTotal),
  };
}

/**
 * How many days a cycle ran — the figure next to the calendar on each row of the
 * cycles list (A-42). A closed cycle counts start → the day it ended; a running
 * one counts start → today, so the number keeps climbing while it lives.
 */
export function cycleDurationDays(
  startDate: Date | string,
  endedAt: Date | string | null,
  today: Date = new Date(),
): number {
  return chickAgeDays(startDate, endedAt ? new Date(endedAt) : today);
}
