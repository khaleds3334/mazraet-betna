"use client";

import { ToggleCard } from "@/components/ui";
import { WeightChoice } from "@/components/shared/WeightChoice";
import { formatCurrency } from "@/lib/format";

/**
 * «اختار الوزن المطلوب» and «الذبح و التنظيف؟» (C-20).
 *
 * The weight row itself is `shared/WeightChoice` — the admin's A-56 asks the
 * same question in the same words, so it is written once (Khaled, 2026-08-23).
 *
 * **One weight for the whole order**, the same as the admin's A-56. FR-27 allows
 * an order to carry several weight lines, and the design does not draw a way to
 * add one — it puts the case in the note field's own example instead («عاوز
 * فرختين لوحدهم و ٣ لوحدهم»), and the split is made later at the scale where the
 * birds actually are (FR-14ب). Adding a repeat-row control here would be UI that
 * is not in the file, on the screen whose whole job is to stay simple.
 *
 * Cleaning is a price the customer is told before he agrees to it, not after —
 * hence the fee sitting under the question rather than surfacing on the invoice.
 */
export function WeightPicker({
  weights,
  weight,
  onWeightChange,
  cleaning,
  onCleaningChange,
  cleaningPrice,
}: {
  weights: number[];
  weight: number | null;
  onWeightChange: (kg: number) => void;
  cleaning: boolean;
  onCleaningChange: (on: boolean) => void;
  cleaningPrice: number;
}) {
  return (
    <div className="flex flex-col gap-3 bg-white px-screen py-4">
      <WeightChoice
        weights={weights}
        value={weight}
        onChange={onWeightChange}
      />

      <ToggleCard
        title="الذبح و التنظيف؟"
        hint={`(${formatCurrency(cleaningPrice)} لكل فرخة)`}
        checked={cleaning}
        onChange={onCleaningChange}
        toggleLabel="الذبح و التنظيف"
      />
    </div>
  );
}
