"use client";

import type { WeighingDraft } from "@/hooks/useWeighingDraft";
import { formatCurrency, pluralizeChicken } from "@/lib/format";
import { WeighingRow } from "./WeighingRow";

/** Bag names, in the order the admin fills them (FR-14ب). */
const BATCH_NAMES = [
  "الوزنة الأولى",
  "الوزنة الثانية",
  "الوزنة الثالثة",
  "الوزنة الرابعة",
  "الوزنة الخامسة",
];

/** Keeps the birds in their entered order while collecting them into bags. */
function groupByBatch(drafts: WeighingDraft[]): [number, WeighingDraft[]][] {
  const bags = new Map<number, WeighingDraft[]>();
  for (const draft of drafts) {
    bags.set(draft.batchNo, [...(bags.get(draft.batchNo) ?? []), draft]);
  }
  return [...bags.entries()].sort(([a], [b]) => a - b);
}

/**
 * The scrolling middle of the weighing sheet: one row per bird, and the dashed
 * box that adds another. This is the only part of A-52 that moves — the order's
 * details stay pinned above it and the invoice below it, so the admin never
 * scrolls away from the total he is about to read out.
 *
 * Once the order is split (FR-14ب) the rows collect into bags, each with its own
 * name, count and running price — because each bag is handed over as its own
 * bag, and "how much is this one?" is asked of each separately (A-55).
 */
export function WeighingList({
  drafts,
  subtotals,
  onWeigh,
  onRemoveLast,
  onAdd,
}: {
  drafts: WeighingDraft[];
  /** What each bag comes to so far, keyed by bag number. */
  subtotals: Record<number, number>;
  onWeigh: (key: string, weight: number) => void;
  onRemoveLast: () => void;
  onAdd: () => void;
}) {
  const bags = groupByBatch(drafts);
  const split = bags.length > 1;
  const lastKey = drafts.at(-1)?.key;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-screen py-3">
      <div className="flex flex-col gap-3">
        {bags.map(([batchNo, birds], bagIndex) => (
          <div key={batchNo} className="flex flex-col gap-3">
            {split && (
              <div className="flex items-center justify-between text-base font-bold text-primary-foreground">
                <span>{BATCH_NAMES[batchNo - 1] ?? "وزنة أخرى"}</span>
                <span>{pluralizeChicken(birds.length)}</span>
              </div>
            )}

            {birds.map((draft, position) => (
              <WeighingRow
                key={draft.key}
                index={position + 1}
                approxWeight={draft.approxWeight}
                weight={draft.actualWeight}
                onChange={(weight) => onWeigh(draft.key, weight)}
                // The bin lives on the very last row only — the admin trims from
                // the end when a customer takes fewer birds than he asked for
                // (FR-14ج). The last bird stays: an order with nothing in it
                // isn't an order.
                onRemove={
                  draft.key === lastKey && drafts.length > 1
                    ? onRemoveLast
                    : undefined
                }
              />
            ))}

            {split && (
              <div className="flex items-center justify-between border-b-2 border-border pb-3 text-base font-bold text-primary-foreground">
                <span>اجمالي السعر</span>
                <span>{formatCurrency(subtotals[batchNo] ?? 0)}</span>
              </div>
            )}

            {/* Only the last bag offers another bird — it is the open one. */}
            {bagIndex === bags.length - 1 && (
              <button
                type="button"
                onClick={onAdd}
                className="dashed-frame min-h-11 w-full rounded-[10px] bg-surface-page text-base text-foreground"
              >
                اضافة فرخة اخري
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
