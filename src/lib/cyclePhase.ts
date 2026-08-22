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
 * `selling_started_at`, written once by «بدء مرحلة البيع» (migration 023). It is
 * the whole answer, and it is the only thing on the cycle whose job this is.
 *
 * It used to be `sale_closes_at`, which also happened to be set when the sale
 * opened — but that column is the date the customer's home counts down to, one
 * the admin moves freely from settings. A field he thinks of as a countdown must
 * not be able to walk a cycle back into التربية (Khaled, 2026-08-22).
 *
 * The two old tests stay as a fallback for rows migration 023 has not reached —
 * a cycle restored from an older dump, or an environment where it has not been
 * applied yet. They can only ever say "selling" about a cycle that really is.
 */

export type CyclePhase = "raising" | "selling" | "ended";

/** The columns the answer depends on, named as they come out of the database. */
export interface CyclePhaseInput {
  is_active: boolean;
  ended_at: string | null;
  selling_started_at: string | null;
  sale_open: boolean;
  sale_closes_at: string | null;
}

/**
 * True once the flock has entered مرحلة البيع, whether or not orders are being
 * taken this minute.
 */
export function isSellingPhase(cycle: {
  selling_started_at: string | null;
  sale_open: boolean;
  sale_closes_at: string | null;
}): boolean {
  return (
    Boolean(cycle.selling_started_at) ||
    // Pre-023 fallback — see the note above.
    cycle.sale_open ||
    Boolean(cycle.sale_closes_at)
  );
}

export function cyclePhase(cycle: CyclePhaseInput): CyclePhase {
  // A cycle is finished the moment it stops being the farm's active one — the
  // timestamp records when, it does not decide it.
  if (!cycle.is_active || cycle.ended_at) return "ended";
  return isSellingPhase(cycle) ? "selling" : "raising";
}
