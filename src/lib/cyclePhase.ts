/**
 * Which stage of its life a cycle is in — one definition, because three screens
 * were each deciding it for themselves and getting it wrong the same way.
 *
 * ## The distinction this exists to keep
 *
 * **مرحلة البيع** is a stage of the flock's life. It opens with «بدء مرحلة البيع»
 * on the cycle and closes when the cycle itself ends — «انهاء فترة البيع», which
 * is `endCycle` and refuses while any order is open or any bird unsold.
 *
 * **`sale_open`** is a switch inside that stage: are we taking orders *right
 * now*. The admin flips it from settings to stop orders for an afternoon, and
 * the last order of the flock flips it too (FR-11). Neither ends anything.
 *
 * Every phase check in the app used to read `sale_open ? "selling" : "raising"`,
 * which collapsed the two: closing the sale for an hour walked the cycle
 * backwards into التربية, put the raising dashboard on the admin's home, and
 * turned the orders screen into the archive of a cycle still full of pending
 * orders (Khaled, 2026-08-22).
 *
 * ## What marks the stage
 *
 * `sale_closes_at`. `startSelling` dates the window as it opens the sale, so a
 * cycle carries it from the moment its selling phase begins and keeps it through
 * every close and re-open. `sale_open` is still consulted alongside it for
 * cycles opened before the window was dated (2026-08-21): those have the switch
 * on and no date, and testing the date alone would call them raising.
 *
 * It is the same test `getSaleControlState` and `setSaleOpen` already used —
 * this only brings the rest of the app to it.
 */

export type CyclePhase = "raising" | "selling" | "ended";

/** The columns the answer depends on, named as they come out of the database. */
export interface CyclePhaseInput {
  is_active: boolean;
  ended_at: string | null;
  sale_open: boolean;
  sale_closes_at: string | null;
}

/**
 * True once the flock has entered مرحلة البيع, whether or not orders are being
 * taken this minute.
 */
export function isSellingPhase(cycle: {
  sale_open: boolean;
  sale_closes_at: string | null;
}): boolean {
  return cycle.sale_open || Boolean(cycle.sale_closes_at);
}

export function cyclePhase(cycle: CyclePhaseInput): CyclePhase {
  // A cycle is finished the moment it stops being the farm's active one — the
  // timestamp records when, it does not decide it.
  if (!cycle.is_active || cycle.ended_at) return "ended";
  return isSellingPhase(cycle) ? "selling" : "raising";
}
