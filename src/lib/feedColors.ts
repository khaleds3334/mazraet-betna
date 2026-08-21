/**
 * feedColors.ts — the one place بادي and نامي are given a colour.
 *
 * Two screens have to agree on this: the «العلف المسحوب» tile and the consumption
 * grid right underneath it (D-48). The admin reads a lime square on the grid and
 * a lime figure in the tile as the same fact — بادي — and a second definition of
 * either would eventually drift and quietly say something else.
 *
 * Text and fill are separate entries because a token that reads well as a figure
 * is not the token that reads well as a filled 20px square.
 */
import type { FeedPhase } from "@/lib/constants";

/** For a figure: the colour the phase's number is printed in. */
export const FEED_PHASE_TEXT: Record<FeedPhase, string> = {
  badi: "text-primary-hover",
  nami: "text-accent-tan",
};

/** For a square on the grid: the colour the phase's day is filled with. */
export const FEED_PHASE_FILL: Record<FeedPhase, string> = {
  badi: "bg-primary-hover",
  nami: "bg-accent-orange",
};
