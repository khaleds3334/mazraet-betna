"use client";

import { WeightRow } from "@/components/ui";
import { OFFERED_WEIGHTS } from "@/lib/constants";

/**
 * «الاوزان المتوفرة» — the weights the farm is willing to sell at, ticked on and
 * off (A-70).
 *
 * Several may be on at once, which is the whole difference between this and
 * `shared/WeightChoice`: that one picks the single weight an order is placed at.
 * The row itself, the arrow and the scrolling are `ui/WeightRow`, shared between
 * them (Khaled, 2026-08-23).
 *
 * It offers every weight the system knows about, not just the ones already
 * ticked — the point of the screen is turning them on and off.
 */
export function WeightsRow({
  selected,
  onToggle,
}: {
  selected: number[];
  onToggle: (weight: number) => void;
}) {
  return (
    <WeightRow
      title="الاوزان المتوفرة"
      selectionLabel="الاوزان المتوفرة"
      multiSelect
      weights={[...OFFERED_WEIGHTS]}
      isSelected={(weight) => selected.includes(weight)}
      onSelect={onToggle}
    />
  );
}
