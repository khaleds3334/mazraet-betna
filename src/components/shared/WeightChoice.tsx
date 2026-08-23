"use client";

import { WeightRow } from "@/components/ui";

/**
 * «اختار الوزن المطلوب في حدود كام بالكجم؟» — picking the one approximate weight
 * an order is placed at (FR-27).
 *
 * Both apps ask this, in the same words: the customer on the order screen (C-20)
 * and the admin on «انشاء طلب باسم عميل» (A-56). It was written out twice,
 * identically, which is the third copy waiting to happen (Khaled, 2026-08-23).
 *
 * The row, the arrow and the scrolling are `ui/WeightRow`, shared with settings'
 * «الاوزان المتوفرة». What is here is the question and the fact that only one
 * answer is allowed — settings ticks several, an order picks one. Same badges,
 * opposite question, which is why they stay two components.
 */
export function WeightChoice({
  weights,
  value,
  onChange,
}: {
  /** The weights the farm offers, from settings (FR-5). */
  weights: number[];
  /** The chosen weight in kg, or null before one is picked. */
  value: number | null;
  onChange: (kg: number) => void;
}) {
  return (
    <WeightRow
      title="اختار الوزن المطلوب في حدود كام بالكجم؟"
      selectionLabel="الوزن المطلوب"
      weights={weights}
      isSelected={(weight) => weight === value}
      onSelect={onChange}
    />
  );
}
