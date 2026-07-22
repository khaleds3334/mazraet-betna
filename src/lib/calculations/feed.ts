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
 * Approximate feed still available vs. what the cycle is expected to need
 * (FR-22: "فاضل قد إيه علف"). Positive = surplus, negative = short.
 */
export function feedBalanceKg(feed: FeedRow[], chickCount: number): number {
  return round3(feedPurchasedKg(feed) - expectedFeedKg(chickCount));
}
