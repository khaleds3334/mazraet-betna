import type { WeighingBatch } from "@/hooks/useWeighingDraft";

/**
 * splitBatches.ts — moving birds between the bags of one order (A-53).
 *
 * The dialog splits; it never changes how many birds there are (D-54). Every
 * operation here therefore **conserves the total**: a bird taken out of one bag
 * lands in another, and the only way a bag appears or disappears is as the far
 * end of that move.
 *
 * Kept out of the component because it is the part with the rules in it, and
 * because a rule about where a bird goes is easier to read as five short
 * functions than as five branches inside a dialog.
 */

/** A bag with nothing in it isn't a bag — it leaves as soon as it empties. */
const withoutEmpty = (batches: WeighingBatch[]): WeighingBatch[] =>
  batches.filter((batch) => batch.count > 0);

const changeAt = (
  batches: WeighingBatch[],
  index: number,
  by: number,
): WeighingBatch[] =>
  batches.map((batch, position) =>
    position === index ? { ...batch, count: batch.count + by } : batch,
  );

/**
 * **Fewer here means more next door.** Taking a bird out of a bag puts it in the
 * bag below, and if there is no bag below, one is created for it — which is how
 * an order that has never been split gets its second bag: he opens the dialog on
 * «٤ فراخ» and taps ﹣ (Khaled, 2026-08-21).
 *
 * The last bird in a bag stays put. Emptying a bag is what the bin is for, and it
 * says where the birds went; a ﹣ that made a row vanish would not.
 */
export function moveDown(
  batches: WeighingBatch[],
  index: number,
): WeighingBatch[] {
  const batch = batches[index];
  if (!batch || batch.count <= 1) return batches;

  const next = index + 1;
  const moved = changeAt(batches, index, -1);

  if (next < batches.length) return changeAt(moved, next, 1);

  return [...moved, { count: 1, weight: batch.weight }];
}

/**
 * **More here means fewer somewhere else.** The bird comes from the nearest bag
 * below — the one ﹣ would have sent it to, so the two buttons undo each other —
 * and from the nearest bag above only when this is the last bag and there is
 * nothing below it to take from.
 *
 * A donor left with nothing is dropped: it has no birds, so there is no bag.
 */
export function moveUp(
  batches: WeighingBatch[],
  index: number,
): WeighingBatch[] {
  const donor = findDonor(batches, index);
  if (donor === -1) return batches;

  return withoutEmpty(changeAt(changeAt(batches, donor, -1), index, 1));
}

/** Whether {@link moveUp} has anywhere to take a bird from. */
export const canMoveUp = (batches: WeighingBatch[], index: number): boolean =>
  findDonor(batches, index) !== -1;

function findDonor(batches: WeighingBatch[], index: number): number {
  for (let i = index + 1; i < batches.length; i++) {
    if (batches[i].count > 0) return i;
  }
  // Nothing below — the last bag can still grow, by taking from the one above it
  // rather than sitting inert while the order has birds in it.
  for (let i = index - 1; i >= 0; i--) {
    if (batches[i].count > 1) return i;
  }
  return -1;
}

/**
 * «اضافة وزنة اخري» — a new bag, opened with one bird from the last bag that can
 * spare one. Same conservation rule: the button adds a bag, never a bird.
 */
export function addBatch(batches: WeighingBatch[]): WeighingBatch[] {
  const donor = lastSpare(batches);
  if (donor === -1) return batches;

  return [
    ...changeAt(batches, donor, -1),
    { count: 1, weight: batches.at(-1)?.weight ?? batches[donor].weight },
  ];
}

/** Whether any bag has a bird to spare for a new one. */
export const canAddBatch = (batches: WeighingBatch[]): boolean =>
  lastSpare(batches) !== -1;

const lastSpare = (batches: WeighingBatch[]): number => {
  for (let i = batches.length - 1; i >= 0; i--) {
    if (batches[i].count > 1) return i;
  }
  return -1;
};

/** Removing a bag hands its birds to the one above it — the first bag, to the one below. */
export function removeBatch(
  batches: WeighingBatch[],
  index: number,
): WeighingBatch[] {
  if (batches.length < 2) return batches;

  const kept = batches.filter((_, position) => position !== index);
  const target = index === 0 ? 0 : index - 1;
  kept[target] = {
    ...kept[target],
    count: kept[target].count + batches[index].count,
  };
  return kept;
}
