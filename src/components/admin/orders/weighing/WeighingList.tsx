"use client";

import type { WeighingDraft } from "@/hooks/useWeighingDraft";
import { WeighingRow } from "./WeighingRow";

/**
 * The scrolling middle of the weighing sheet: one row per bird, and the dashed
 * box that adds another. This is the only part of A-52 that moves — the order's
 * details stay pinned above it and the invoice below it, so the admin never
 * scrolls away from the total he is about to read out.
 */
export function WeighingList({
  drafts,
  onWeigh,
  onRemoveLast,
  onAdd,
}: {
  drafts: WeighingDraft[];
  onWeigh: (key: string, weight: number) => void;
  onRemoveLast: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-screen py-3">
      <div className="flex flex-col gap-3">
        {drafts.map((draft, index) => (
          <WeighingRow
            key={draft.key}
            index={index + 1}
            approxWeight={draft.approxWeight}
            weight={draft.actualWeight}
            onChange={(weight) => onWeigh(draft.key, weight)}
            // The bin lives on the last row only — the admin trims from the end
            // when a customer takes fewer birds than he asked for (FR-14ج). The
            // last bird stays: an order with nothing in it isn't an order.
            onRemove={
              index === drafts.length - 1 && drafts.length > 1
                ? onRemoveLast
                : undefined
            }
          />
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="dashed-frame min-h-11 w-full rounded-[10px] bg-surface-page text-base text-foreground"
        >
          اضافة فرخة اخري
        </button>
      </div>
    </div>
  );
}
