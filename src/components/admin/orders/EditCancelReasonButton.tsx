"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenGlyph } from "@/components/shared/PenGlyph";
import { updateCancelReason } from "@/lib/actions/orders";
import { useToast } from "@/hooks/useToast";
import { CancelReasonDialog } from "./CancelReasonDialog";

/**
 * The pen next to the reason on a cancelled card — tap it to correct what was
 * written (Khaled, 2026-08-18). The glyph is 20px as drawn, inside a 44px target
 * so it stays tappable with busy hands.
 */
export function EditCancelReasonButton({
  orderId,
  reason,
}: {
  orderId: string;
  reason: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="تعديل سبب الإلغاء"
        className="flex size-11 shrink-0 items-center justify-center text-error"
      >
        <PenGlyph />
      </button>

      <CancelReasonDialog
        // Remounts on open so the field always starts from what is saved now,
        // discarding anything typed and abandoned last time.
        key={open ? "open" : "closed"}
        open={open}
        onClose={() => setOpen(false)}
        fieldId={`edit-cancel-reason-${orderId}`}
        question="تعديل سبب الغاء الطلب"
        confirmLabel="حفظ السبب"
        initialReason={reason ?? ""}
        onConfirm={async (next) => {
          const result = await updateCancelReason(orderId, next);
          if (result.ok) {
            toast.success("تم تعديل سبب الإلغاء");
            router.refresh();
          }
          return result;
        }}
      />
    </>
  );
}
