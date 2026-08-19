"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CardAction } from "@/components/ui";
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
      <CardAction variant="danger" icon="cancel" onClick={() => setOpen(true)}>
        الغاء الطلب
      </CardAction>

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
