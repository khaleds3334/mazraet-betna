/**
 * feed.ts — feed accounting (FR-22). Bags are 50 kg; expected lifetime
 * consumption is ~0.75 kg (grower) + 2.75 kg (finisher) per chick.
 * Feed cost feeds into the cycle's final accounting (FR-19).
 */
import {
  FEED_BAG_KG,
  FEED_PER_CHICK_KG,
  type FeedPhase,
} from "@/lib/constants";

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
 * Per-chick amounts confirmed by Khaled (2026-08-20): ٠.٧٥ كجم بادي +
 * ٢.٧٥ كجم نامي.
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
 * Bags split into بادي and نامي — the same sum for both tables that count them:
 * what was **bought** (`feed`, phase stored since migration 013) and what was
 * **opened** (`feed_withdrawal`, since 017).
 *
 * Rows from before those migrations whose phase couldn't be attributed are left
 * null in the database; they're folded in بادي-first — the order the flock eats
 * it in, and the rule the app used before the columns existed. New data never
 * reaches that branch.
 */
export function bagsByPhase(
  rows: { bags: number; phase: FeedPhase | null }[],
  requiredBadi: number,
): { badi: number; nami: number } {
  let badi = 0;
  let nami = 0;
  let unattributed = 0;

  for (const row of rows) {
    if (row.phase === "badi") badi += row.bags;
    else if (row.phase === "nami") nami += row.bags;
    else unattributed += row.bags;
  }

  if (unattributed > 0) {
    const badiGap = Math.max(0, requiredBadi - badi);
    const toBadi = Math.min(unattributed, badiGap);
    badi += toBadi;
    nami += unattributed - toBadi;
  }

  return { badi: round2(badi), nami: round2(nami) };
}

/**
 * Which feed the next opened bag is, offered as the default in the «سحب شكارة»
 * popup (A-13). **Quantity decides it, and nothing else** (Khaled, 2026-08-21):
 * bags are بادي until the cycle's بادي requirement has been opened, then نامي.
 *
 * The flock's age was the other candidate and was turned down — a rule that
 * flipped to نامي on day ١٦ regardless would contradict a large cycle whose بادي
 * quota still has bags in it, and two rules that can disagree are a rule the
 * admin can't predict.
 *
 * It is a **default**, never a verdict: the popup lets him say otherwise, and
 * that answer is what gets stored.
 */
export function nextWithdrawalPhase(input: {
  /** بادي bags already opened this cycle. */
  withdrawnBadi: number;
  requiredBadi: number;
}): FeedPhase {
  return input.withdrawnBadi < input.requiredBadi ? "badi" : "nami";
}

/**
 * Bags still to buy for each phase — what the purchase form (A-15) opens on, so
 * the admin isn't asked again for feed he has already brought in.
 *
 * Never negative: once he has bought everything the cycle needs, both open at
 * zero and he types whatever he is actually buying.
 *
 * Halves survive the subtraction: a cycle needing ١.٥ shows ٠ once ١.٥ is bought,
 * not the ٠.٥ the old whole-bag rounding left behind (Khaled, 2026-08-21).
 */
export function remainingFeedBags(input: {
  requiredBadi: number;
  requiredNami: number;
  purchasedBadi: number;
  purchasedNami: number;
}): { badi: number; nami: number } {
  return {
    badi: round2(Math.max(0, input.requiredBadi - input.purchasedBadi)),
    nami: round2(Math.max(0, input.requiredNami - input.purchasedNami)),
  };
}

/**
 * Approximate feed still available vs. what the cycle is expected to need
 * (FR-22: "فاضل قد إيه علف"). Positive = surplus, negative = short.
 */
export function feedBalanceKg(feed: FeedRow[], chickCount: number): number {
  return round3(feedPurchasedKg(feed) - expectedFeedKg(chickCount));
}
