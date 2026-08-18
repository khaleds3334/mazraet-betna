"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { cancelOrder } from "@/lib/actions/orders";
import { useToast } from "@/hooks/useToast";
import { CancelReasonDialog } from "./CancelReasonDialog";

/**
 * "الغاء الطلب" on a pending order card, and the confirm dialog behind it (A-51).
 * The card re-renders as the cancelled variant once it goes through.
 */
export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-md border border-error px-3 text-base text-error"
      >
        <span className="flex size-4 items-center justify-center rounded-full bg-error text-white">
          <Icon name="cancel" size={14} />
        </span>
        <span className="optical-center">الغاء الطلب</span>
      </button>

      <CancelReasonDialog
        open={open}
        onClose={() => setOpen(false)}
        fieldId={`cancel-reason-${orderId}`}
        question="هل انت متأكد من الغاء الطلب؟"
        confirmLabel="الغاء الطلب"
        onConfirm={async (reason) => {
          const result = await cancelOrder(orderId, reason);
          if (result.ok) {
            toast.success("تم الغاء الطلب");
            router.refresh();
          }
          return result;
        }}
      />
    </>
  );
}
