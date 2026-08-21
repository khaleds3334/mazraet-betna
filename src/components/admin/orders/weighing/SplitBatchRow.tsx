"use client";

import { Icon, StepButton } from "@/components/ui";
import type { WeighingBatch } from "@/hooks/useWeighingDraft";
import { formatArabicNumber, formatWeight } from "@/lib/format";
import { TrashGlyph } from "./glyphs";

/**
 * Which weight this bag was asked at — the same list the order was booked from.
 *
 * The native arrow is dropped (`appearance-none`) and drawn as our own `arrowDown`
 * on the **right**, the leading edge in RTL, at the 24px every other field in the
 * app uses. The browser's own arrow was a few pixels tall, on whichever side the
 * platform felt like, and unreadable next to a 24px date icon two screens away
 * (Khaled, 2026-08-21). The `<select>` underneath is untouched, so the phone still
 * opens its native picker.
 */
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
    <div className="relative flex h-11 w-full min-w-0 items-center rounded-lg border border-border bg-white">
      <Icon
        name="arrowDown"
        size={24}
        aria-hidden
        className="pointer-events-none absolute end-2 shrink-0 text-foreground"
      />
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-full w-full min-w-0 appearance-none truncate bg-transparent ps-3 pe-9 text-right text-base font-bold text-foreground outline-none"
      >
        {options.map((weight) => (
          <option key={weight} value={weight}>
            {formatWeight(weight)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * One bag in the split dialog: how many birds, at what weight, and the bin that
 * undoes it. The ± are drawn at the design's 24px but keep a 44px tap target —
 * this is a control the admin uses standing over a scale (rule 8).
 *
 * The two fields share the row's width rather than holding fixed ones: at 320px
 * the old `w-26` + `w-36` + the bin ran past the dialog's padding and out of its
 * side (Khaled, 2026-08-21).
 *
 * **± moves birds between bags, it doesn't create or destroy them** — see
 * `SplitOrderDialog`. This row only says which direction was asked for.
 */
export function SplitBatchRow({
  batch,
  index,
  weights,
  canIncrease,
  canDecrease,
  canRemove,
  onChange,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  batch: WeighingBatch;
  index: number;
  weights: number[];
  canIncrease: boolean;
  canDecrease: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<WeighingBatch>) => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {
  const name = `الوزنة رقم ${formatArabicNumber(index + 1)}`;

  return (
    <div className="flex items-end gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-base text-foreground">عدد الفراخ</span>
        <div className="flex h-11 w-full min-w-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-1">
          <StepButton
            sign="plus"
            size={24}
            tone="solid"
            label={`زيادة فراخ ${name}`}
            disabled={!canIncrease}
            onClick={onIncrease}
          />
          <span className="min-w-4 text-center text-h4 font-bold text-foreground">
            {formatArabicNumber(batch.count)}
          </span>
          <StepButton
            sign="minus"
            size={24}
            tone="solid"
            label={`تقليل فراخ ${name}`}
            disabled={!canDecrease}
            onClick={onDecrease}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-base text-foreground">الوزن المطلوب</span>
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
