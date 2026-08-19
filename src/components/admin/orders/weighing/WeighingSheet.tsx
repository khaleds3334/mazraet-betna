"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet, Checkbox, CloseButton } from "@/components/ui";
import { computeInvoice } from "@/lib/calculations/invoice";
import { saveWeights } from "@/lib/actions/orders";
import type { OrderListItem } from "@/lib/queries/orders";
import { useToast } from "@/hooks/useToast";
import {
  useWeighingDraft,
  type WeighingDraft,
} from "@/hooks/useWeighingDraft";
import { WeighingHeader } from "./WeighingHeader";
import { WeighingList } from "./WeighingList";
import { WeighingSummary } from "./WeighingSummary";

function toDrafts(order: OrderListItem): WeighingDraft[] {
  return order.weighing.lines.map((line) => ({
    key: line.id,
    id: line.id,
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
}: {
  open: boolean;
  onClose: () => void;
  order: OrderListItem;
  /** Live settings — used until this order stamps its own prices (T-15). */
  salePrice: number;
  cleaningPrice: number;
}) {
  const router = useRouter();
  const toast = useToast();

  // The weigh-out lives in the draft, not in this component: it has to survive
  // the sheet being closed by accident and the page being reloaded (see the hook).
  const {
    lines: drafts,
    cleaning,
    setCleaning,
    restored,
    weigh,
    addBird,
    removeLast,
    clear,
  } = useWeighingDraft(order.id, {
    cleaning: order.weighing.cleaning,
    lines: toDrafts(order),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Said out loud the first time the sheet is opened: weights appearing on their
  // own would otherwise read as the app having saved something it hasn't. Gated
  // on `open` because every order card keeps its sheet mounted for the slide-in.
  const announced = useRef(false);
  useEffect(() => {
    if (!open || !restored || announced.current) return;
    announced.current = true;
    toast.info("رجّعنالك الأوزان اللي كنت مسجّلها قبل ما تقفل");
  }, [open, restored, toast]);

  const unitPrice = order.weighing.unitPrice ?? salePrice;
  const cleaningFee = order.weighing.cleaningPrice ?? cleaningPrice;

  // The same function the rest of the app computes invoices with — the sheet
  // shows exactly what the order will be worth once it is saved.
  const invoice = computeInvoice(
    { unit_price: unitPrice, cleaning_price: cleaningFee },
    drafts.map((draft, index) => ({
      id: draft.key,
      batch_no: 1,
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

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label="اضافة اوزان الطلب"
      size="full"
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 flex-col gap-4 px-screen pt-4">
          <header className="flex items-center justify-between">
            <h2 className="text-h6 font-bold text-heading">
              اضافة اوزان الطلب
            </h2>
            <CloseButton onClick={onClose} />
          </header>

          <WeighingHeader
            order={order}
            unitPrice={unitPrice}
            chickenCount={drafts.length}
            cleaning={cleaning}
            onCleaningChange={setCleaning}
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-bold text-heading">
              ضع الوزن الصافي (كجم)
            </span>
            {/* Visible but inert until the split weigh-out is built (FR-14ب). */}
            <Checkbox
              label="تقسيم الطلب"
              checked={false}
              onChange={() => {}}
              disabled
            />
          </div>
        </div>

        <WeighingList
          drafts={drafts}
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
      </div>
    </BottomSheet>
  );
}
