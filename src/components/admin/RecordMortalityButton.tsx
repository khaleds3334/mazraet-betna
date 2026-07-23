"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Modal, NumberStepper } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { recordMortality } from "@/lib/actions/cycles";
import { cn } from "@/lib/utils";
import { actionPillBase, actionPillVariant } from "./cycleActionStyles";

/**
 * "تسجيل نافق" (A-14): the red dashboard pill plus its confirm popup — a count
 * field and a submit. Recording is not a critical action, so success/failure use
 * a toast (the live count and mortality rate refresh on their own). Failure keeps
 * the popup open with the entered count so the admin can retry.
 */
export function RecordMortalityButton({ className }: { className?: string }) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(actionPillBase, actionPillVariant.danger, className)}
      >
        تسجيل نافق
      </button>

      <Modal open={open} onClose={close} label="تسجيل نافق">
        <div className="flex flex-col gap-4">
          {/* Title on the right, close on the left (app convention). */}
          <div className="flex items-center justify-between">
            <p className="text-accent-brown">هل انت متأكد من تسجيل نافق؟</p>
            <button
              type="button"
              onClick={close}
              aria-label="إغلاق"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-error text-white"
            >
              <Icon name="cancel" size={16} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="w-full text-right text-h6 font-bold text-error">
              عدد الكتاكيت النافق
            </p>
            <NumberStepper
              label="عدد الكتاكيت النافق"
              value={count}
              onChange={setCount}
              tone="danger"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className={cn(
              actionPillBase,
              actionPillVariant.danger,
              "self-end disabled:opacity-60",
            )}
          >
            تسجيل نافق
          </button>
        </div>
      </Modal>
    </>
  );
}
