/**
 * feed.ts — feed accounting (FR-22). Bags are 50 kg; expected lifetime
 * consumption is ~0.75 kg (grower) + 2.75 kg (finisher) per chick.
 * Feed cost feeds into the cycle's final accounting (FR-19).
 */
import { FEED_BAG_KG, FEED_PER_CHICK_KG } from "@/lib/constants";

type FeedRow = { bags: number; bag_price: number };

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Total feed bought so far, in kilograms. */
export function feedPurchasedKg(feed: FeedRow[]): number {
  return round3(feed.reduce((sum, f) => sum + f.bags * FEED_BAG_KG, 0));
}

/** Total feed bags bought so far (العلف — الإجمالي المشترى). */
export function feedBagsPurchased(feed: { bags: number }[]): number {
  return feed.reduce((sum, f) => sum + f.bags, 0);
}

/** Total feed bags withdrawn/consumed so far (العلف المسحوب, A-11). */
export function feedBagsWithdrawn(withdrawals: { bags: number }[]): number {
  return withdrawals.reduce((sum, w) => sum + w.bags, 0);
}

/** Bags still in the store: bought − withdrawn, never below zero (العلف المتوفر). */
export function feedBagsAvailable(
  feed: { bags: number }[],
  withdrawals: { bags: number }[],
): number {
  return Math.max(0, feedBagsPurchased(feed) - feedBagsWithdrawn(withdrawals));
}

/** Total spent on feed (enters cycle expenses — FR-19). */
export function feedCost(feed: FeedRow[]): number {
  return round2(feed.reduce((sum, f) => sum + f.bags * f.bag_price, 0));
}

/** Expected feed for the whole cycle, in kilograms, for a given flock size. */
export function expectedFeedKg(chickCount: number): number {
  const perChick = FEED_PER_CHICK_KG.grower + FEED_PER_CHICK_KG.finisher;
  return round3(chickCount * perChick);
}

/**
 * Expected feed bags per phase for a flock, shown on the create-cycle sheet
 * (A-41, "العلف المطلوب"). Two values — بادي (starter) and نامي (grower) — each
 * rounded to the nearest **half** 50kg bag (e.g. `3.5`) rather than a whole bag,
 * so the estimate stays reasonably precise instead of always rounding up.
 * ⚠️ Provisional: the per-chick amounts and phase labels are pending review with
 * Khaled.
 */
export function expectedFeedBags(chickCount: number): {
  badi: number;
  nami: number;
} {
  const bags = (kgPerChick: number) =>
    Math.max(0, Math.round((chickCount * kgPerChick) / FEED_BAG_KG / 0.5) * 0.5);
  return {
    badi: bags(FEED_PER_CHICK_KG.grower),
    nami: bags(FEED_PER_CHICK_KG.finisher),
  };
}

/**
 * Approximate feed still available vs. what the cycle is expected to need
 * (FR-22: "فاضل قد إيه علف"). Positive = surplus, negative = short.
 */
export function feedBalanceKg(feed: FeedRow[], chickCount: number): number {
  return round3(feedPurchasedKg(feed) - expectedFeedKg(chickCount));
}
