"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui";
import { computeInvoice } from "@/lib/calculations/invoice";
import { saveWeights } from "@/lib/actions/orders";
import type { OrderListItem } from "@/lib/queries/orders";
import { useToast } from "@/hooks/useToast";
import { useWeighingDraft, type WeighingDraft } from "@/hooks/useWeighingDraft";
import { WeighingSheetHeader } from "./WeighingSheetHeader";
import { WeighingList } from "./WeighingList";
import { SplitOrderDialog } from "./SplitOrderDialog";
import { WeighingSummary } from "./WeighingSummary";

function toDrafts(order: OrderListItem): WeighingDraft[] {
  return order.weighing.lines.map((line) => ({
    key: line.id,
    id: line.id,
    batchNo: line.batchNo,
    approxWeight: line.approxWeight,
    actualWeight: line.actualWeight,
  }));
}

/**
 * "اضافة اوزان الطلب" (A-52) — the most important screen in the project (FR-14).
 * The admin stands at the scale, hands full, and types each bird's real weight;
 * the invoice at the foot recomputes with every gram.
 *
 * Nothing is written until "حفظ الاوزان": the whole weigh-out is one save, so a
 * half-finished order can never reach the customer as a price.
 */
export function WeighingSheet({
  open,
  onClose,
  order,
  salePrice,
  cleaningPrice,
  weights,
}: {
  open: boolean;
  onClose: () => void;
  order: OrderListItem;
  /** Live settings — used until this order stamps its own prices (T-15). */
  salePrice: number;
  cleaningPrice: number;
  /** The weights an order may be asked at (FR-5) — what a bag can be set to. */
  weights: number[];
}) {
  const router = useRouter();
  const toast = useToast();

  // The weigh-out lives in the draft, not in this component: it has to survive
  // the sheet being closed by accident and the page being reloaded (see the hook).
  const {
    lines: drafts,
    batches,
    cleaning,
    setCleaning,
    restored,
    weigh,
    addBird,
    removeLast,
    split,
    clear,
  } = useWeighingDraft(order.id, {
    cleaning: order.weighing.cleaning,
    lines: toDrafts(order),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [splitting, setSplitting] = useState(false);

  // Said out loud the first time the sheet is opened: work appearing on its own
  // would otherwise read as the app having saved something it hasn't. It says
  // «الشغل» rather than «الأوزان» because a split is restored too, and an order
  // may come back re-bagged without a single weight on it (D-56). Gated on `open`
  // because every order card keeps its sheet mounted for the slide-in.
  const announced = useRef(false);
  useEffect(() => {
    if (!open || !restored || announced.current) return;
    announced.current = true;
    toast.info("رجّعنالك الشغل اللي كنت عامله قبل ما تقفل");
  }, [open, restored, toast]);

  const unitPrice = order.weighing.unitPrice ?? salePrice;
  // Only ever true for an order that carries its own stamped price: one taken
  // before T-15 falls back to today's, and there is nothing to have moved.
  const priceChanged = unitPrice !== salePrice;
  const cleaningFee = order.weighing.cleaningPrice ?? cleaningPrice;

  // The same function the rest of the app computes invoices with — the sheet
  // shows exactly what the order will be worth once it is saved.
  const invoice = computeInvoice(
    { unit_price: unitPrice, cleaning_price: cleaningFee },
    drafts.map((draft, index) => ({
      id: draft.key,
      batch_no: draft.batchNo,
      position: index + 1,
      actual_weight: draft.actualWeight,
      cleaning,
    })),
  );

  async function submit() {
    const unweighed = drafts.filter((draft) => draft.actualWeight == null);
    if (drafts.length === 0) {
      setError("مفيش فراخ في الطلب — ضيف فرخة او اقفل.");
      return;
    }
    if (unweighed.length > 0) {
      setError("في فراخ لسه من غير وزن — اوزنها او امسحها.");
      return;
    }

    setError(null);
    setSaving(true);
    const result = await saveWeights({
      orderId: order.id,
      cleaning,
      lines: drafts.map((draft, index) => ({
        id: draft.id,
        position: index + 1,
        batchNo: draft.batchNo,
        approxWeight: draft.approxWeight,
        actualWeight: draft.actualWeight ?? 0,
      })),
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    clear();
    toast.success("تم حفظ الأوزان");
    onClose();
    router.refresh();
  }

  // What each bag comes to so far, for the running subtotal over its rows.
  const subtotals = Object.fromEntries(
    invoice.batches.map((batch) => [batch.batchNo, batch.subtotal]),
  );

  const isSplit = batches.length > 1;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label="اضافة اوزان الطلب"
      size="full"
    >
      <div className="flex h-full flex-col">
        <WeighingSheetHeader
          order={order}
          unitPrice={unitPrice}
          priceChanged={priceChanged}
          chickenCount={drafts.length}
          cleaning={cleaning}
          onCleaningChange={setCleaning}
          isSplit={isSplit}
          onSplit={() => setSplitting(true)}
          onUnsplit={() =>
            split([{ count: drafts.length, weight: batches[0].weight }])
          }
          onClose={onClose}
        />

        <WeighingList
          drafts={drafts}
          subtotals={subtotals}
          onWeigh={weigh}
          onRemoveLast={removeLast}
          onAdd={addBird}
        />

        <WeighingSummary
          invoice={invoice}
          unitPrice={unitPrice}
          error={error}
          saving={saving}
          onSave={submit}
        />

        <SplitOrderDialog
          open={splitting}
          onClose={() => setSplitting(false)}
          chickenCount={drafts.length}
          weights={weights}
          initial={batches}
          onSave={(batches) => {
            split(batches);
            setSplitting(false);
          }}
        />
      </div>
    </BottomSheet>
  );
}
