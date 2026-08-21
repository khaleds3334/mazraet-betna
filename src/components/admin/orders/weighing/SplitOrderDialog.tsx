"use client";

import { useState } from "react";
import {
  Button,
  CloseButton,
  DashedAddButton,
  InlineError,
  Modal,
} from "@/components/ui";
import type { WeighingBatch } from "@/hooks/useWeighingDraft";
import { pluralizeChicken } from "@/lib/format";
import { SplitBatchRow } from "./SplitBatchRow";
import {
  addBatch,
  canAddBatch,
  canMoveUp,
  moveDown,
  moveUp,
  removeBatch,
} from "./splitBatches";

/**
 * "تقسيم الفراخ وزنات مختلفة" (A-53) — the same birds, dealt into bags.
 *
 * It splits; it never changes how many birds there are. Adding and removing a
 * bird belongs on the sheet behind this, where the admin can see the weights he
 * has already taken.
 *
 * **So ± moves a bird between bags** (D-54, `splitBatches.ts`). Taking one out of
 * a bag puts it in the bag below — creating that bag if it is the first time,
 * which is how an order that has never been split gets its second weight: he
 * opens on «٤ فراخ» and taps ﹣ (Khaled, 2026-08-21). ＋ takes the bird back from
 * the same place, so the two buttons undo each other.
 *
 * The counts therefore add up on their own, and «حفظ» is only ever refused for a
 * split that arrived here already broken — a draft saved before this rule existed.
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
              canIncrease={canMoveUp(batches, index)}
              canDecrease={batch.count > 1}
              canRemove={batches.length > 1}
              onChange={(patch) => update(index, patch)}
              onIncrease={() => setBatches((now) => moveUp(now, index))}
              onDecrease={() => setBatches((now) => moveDown(now, index))}
              onRemove={() => setBatches((now) => removeBatch(now, index))}
            />
          ))}
        </div>

        {canAddBatch(batches) && (
          <DashedAddButton
            label="اضافة وزنة اخري"
            onClick={() => setBatches(addBatch)}
          />
        )}

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
