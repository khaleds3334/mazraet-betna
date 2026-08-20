"use client";

import { useState } from "react";
import { Button, CloseButton, InlineError, Modal } from "@/components/ui";
import type { WeighingBatch } from "@/hooks/useWeighingDraft";
import { pluralizeChicken } from "@/lib/format";
import { SplitBatchRow } from "./SplitBatchRow";

/**
 * "تقسيم الفراخ وزنات مختلفة" (A-53) — the same birds, dealt into bags.
 *
 * It splits; it never changes how many birds there are. Adding and removing a
 * bird belongs on the sheet behind this, where the admin can see the weights he
 * has already taken. So every bag's count is moved *between* bags, and the
 * counts must add up to the order before it can be saved — a bag list that
 * doesn't account for every bird would leave birds with no bag to go in.
 */
export function SplitOrderDialog({
  open,
  onClose,
  chickenCount,
  weights,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  /** How many birds the order has — the number the bags must add up to. */
  chickenCount: number;
  weights: number[];
  initial: WeighingBatch[];
  onSave: (batches: WeighingBatch[]) => void;
}) {
  const [batches, setBatches] = useState<WeighingBatch[]>(initial);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setBatches(initial);
  }

  const dealt = batches.reduce((sum, batch) => sum + batch.count, 0);
  const left = chickenCount - dealt;

  function update(index: number, patch: Partial<WeighingBatch>) {
    setBatches((current) =>
      current.map((batch, position) =>
        position === index ? { ...batch, ...patch } : batch,
      ),
    );
  }

  /** A new bag starts with one bird, taken from the last bag that can spare it. */
  function addBatch() {
    setBatches((current) => {
      const donor = [...current]
        .reverse()
        .findIndex((batch) => batch.count > 1);
      if (left <= 0 && donor === -1) return current;

      const next = current.map((batch, position) =>
        left <= 0 && position === current.length - 1 - donor
          ? { ...batch, count: batch.count - 1 }
          : batch,
      );
      return [
        ...next,
        { count: 1, weight: current.at(-1)?.weight ?? weights[0] },
      ];
    });
  }

  /** Removing a bag hands its birds back to the one above it. */
  function removeBatch(index: number) {
    setBatches((current) => {
      if (current.length < 2) return current;
      const kept = current.filter((_, position) => position !== index);
      const target = index === 0 ? 0 : index - 1;
      kept[target] = {
        ...kept[target],
        count: kept[target].count + current[index].count,
      };
      return kept;
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="تقسيم الفراخ وزنات مختلفة"
      header={
        <div className="flex items-center justify-between gap-2">
          <p className="text-base text-accent-brown">
            تقسيم الفراخ وزنات مختلفة
          </p>
          <CloseButton onClick={onClose} size="sm" />
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex flex-col gap-3">
          {batches.map((batch, index) => (
            <SplitBatchRow
              key={index}
              batch={batch}
              index={index}
              weights={weights}
              canAdd={left > 0}
              canRemove={batches.length > 1}
              onChange={(patch) => update(index, patch)}
              onRemove={() => removeBatch(index)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addBatch}
          className="dashed-frame min-h-11 w-full rounded-[10px] bg-surface-page text-base text-foreground"
        >
          اضافة وزنة اخري
        </button>

        {left !== 0 && (
          <InlineError
            message={
              left > 0
                ? `لسه ${pluralizeChicken(left)} من غير وزنة.`
                : `الوزنات فيها ${pluralizeChicken(-left)} زيادة عن الطلب.`
            }
          />
        )}

        <Button
          onClick={() => onSave(batches)}
          disabled={left !== 0}
          className="w-38 self-start"
        >
          حفظ
        </Button>
      </div>
    </Modal>
  );
}
