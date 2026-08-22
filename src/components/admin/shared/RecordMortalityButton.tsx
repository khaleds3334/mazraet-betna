"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton, CloseButton, Modal, NumberStepper } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { recordMortality } from "@/lib/actions/cycles";
import { pluralizeChicken } from "@/lib/format";

/**
 * "تسجيل نافق" (A-14): the red dashboard pill plus its confirm popup — a count
 * field and a submit. Recording is not a critical action, so success/failure use
 * a toast (the live count and mortality rate refresh on their own). Failure keeps
 * the popup open with the entered count so the admin can retry.
 *
 * **The field stops at the birds the flock still has** (FR-23). Without a ceiling
 * a cycle of fifty that had sold forty-two and lost six took five more dead and
 * came out having produced fifty-three (Khaled, 2026-08-22). Birds already sold
 * or promised to an order are not free to die here either — that is a cancelled
 * order, not a mortality row — so the ceiling is «الفراخ المتوفرة», the same one
 * the order sheet stops at (D-58).
 */
export function RecordMortalityButton({
  available,
  className,
}: {
  /** Birds still free — the ceiling on what can be recorded dead. */
  available: number;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Replaces its own last toast rather than queueing behind it — the "+" repeats
  // while it is held, so the ceiling can be hit a dozen times in a second.
  const limitToast = useRef<number | null>(null);

  function sayTheLimit() {
    if (limitToast.current !== null) toast.dismiss(limitToast.current);
    limitToast.current = toast.info(
      available > 0
        ? `الفراخ المتوفرة حاليا في المزرعة ${pluralizeChicken(available)}`
        : "مفيش فراخ متاحة في الدورة دي",
    );
  }

  function close() {
    setOpen(false);
    setCount(0);
  }

  async function submit() {
    if (count <= 0) {
      toast.error("اكتب عدد النافق الأول");
      return;
    }
    setSubmitting(true);
    const res = await recordMortality(count);
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("تم تسجيل النفوق");
    close();
    router.refresh();
  }

  return (
    <>
      <ActionButton variant="danger" onClick={() => setOpen(true)} className={className}>
        تسجيل نافق
      </ActionButton>

      <Modal
        open={open}
        onClose={close}
        label="تسجيل نافق"
        header={
          /* Title on the right, close on the left (app convention). */
          <div className="flex items-center justify-between">
            <p className="text-accent-brown">هل انت متأكد من تسجيل نافق؟</p>
            <CloseButton onClick={close} size="sm" />
          </div>
        }
      >
        <div className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col items-center gap-3">
            <p className="w-full text-right text-h6 font-bold text-error">
              عدد الكتاكيت النافق
            </p>
            <NumberStepper
              label="عدد الكتاكيت النافق"
              value={count}
              onChange={setCount}
              max={available}
              onMax={sayTheLimit}
              tone="danger"
              centerField
            />
          </div>

          <ActionButton
            variant="danger"
            onClick={submit}
            isLoading={submitting}
            disabled={available <= 0}
            className="self-end"
          >
            تسجيل نافق
          </ActionButton>
        </div>
      </Modal>
    </>
  );
}
