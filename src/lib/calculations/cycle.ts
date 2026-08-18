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
 * Estimated total expenses of a cycle at creation time, shown on the create-cycle
 * sheet (A-41, "المصاريف المتوقعة"). ⚠️ Provisional: a forecast, not the real
 * total — chick cost (count × price) plus an estimate of feed cost (expected bags
 * × the assumed bag price, since no feed is bought yet). Real expenses come from
 * the feed/expense tables during the cycle.
 */
export function estimatedCycleExpenses(
  chickCount: number,
  chickPrice: number,
): number {
  const chickCost = chickCount * chickPrice;
  const { badi, nami } = expectedFeedBags(chickCount);
  const feedCostEstimate = (badi + nami) * ASSUMED_FEED_BAG_PRICE;
  return round2(chickCost + feedCostEstimate);
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
