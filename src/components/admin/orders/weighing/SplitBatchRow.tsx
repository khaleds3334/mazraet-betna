"use client";

import { StepButton } from "@/components/ui";
import type { WeighingBatch } from "@/hooks/useWeighingDraft";
import { formatArabicNumber, formatWeight } from "@/lib/format";
import { TrashGlyph } from "./glyphs";

/** Which weight this bag was asked at — the same list the order was booked from. */
function WeightSelect({
  value,
  weights,
  onChange,
  label,
}: {
  value: number;
  weights: number[];
  onChange: (weight: number) => void;
  label: string;
}) {
  const options = weights.includes(value) ? weights : [value, ...weights];

  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-11 w-36 rounded-lg border border-border bg-white px-3 text-right text-base font-bold text-foreground outline-none"
    >
      {options.map((weight) => (
        <option key={weight} value={weight}>
          {formatWeight(weight)}
        </option>
      ))}
    </select>
  );
}

/**
 * One bag in the split dialog: how many birds, at what weight, and the bin that
 * undoes it. The ± are drawn at the design's 24px but keep a 44px tap target —
 * this is a control the admin uses standing over a scale (rule 8).
 */
export function SplitBatchRow({
  batch,
  index,
  weights,
  canAdd,
  canRemove,
  onChange,
  onRemove,
}: {
  batch: WeighingBatch;
  index: number;
  weights: number[];
  canAdd: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<WeighingBatch>) => void;
  onRemove: () => void;
}) {
  const name = `الوزنة رقم ${formatArabicNumber(index + 1)}`;

  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex flex-col gap-2">
        <span className="text-base text-foreground">عدد الفراخ</span>
        <div className="flex h-11 w-26 items-center justify-center gap-2 rounded-lg border border-border bg-white">
          <StepButton
            sign="plus"
            size={24}
            tone="solid"
            label={`زيادة فراخ ${name}`}
            disabled={!canAdd}
            onClick={() => onChange({ count: batch.count + 1 })}
          />
          <span className="min-w-4 text-center text-h4 font-bold text-foreground">
            {formatArabicNumber(batch.count)}
          </span>
          <StepButton
            sign="minus"
            size={24}
            tone="solid"
            label={`تقليل فراخ ${name}`}
            disabled={batch.count <= 1}
            onClick={() => onChange({ count: batch.count - 1 })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-base text-foreground">الوزن المطلوب</span>
        <WeightSelect
          value={batch.weight}
          weights={weights}
          onChange={(weight) => onChange({ weight })}
          label={`الوزن المطلوب لـ${name}`}
        />
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`امسح ${name}`}
        className="flex size-11 shrink-0 items-center justify-center text-error-soft disabled:opacity-40"
      >
        <TrashGlyph size={28} />
      </button>
    </div>
  );
}
