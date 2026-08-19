"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CardAction } from "@/components/ui";
import { recordPayment } from "@/lib/actions/payments";
import { useToast } from "@/hooks/useToast";
import { PaymentDialog } from "../PaymentDialog";

/**
 * A delivered order's card (A-50). The birds are gone, so the only thing left to
 * do with it is money: look at the invoice, and — while anything is still owed —
 * take another instalment (FR-17). A settled order shows the invoice alone.
 */
export function DeliveredOrderActions({
  orderId,
  amountDue,
}: {
  orderId: string;
  /** Still owed. Zero means the order is finished with. */
  amountDue: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [collecting, setCollecting] = useState(false);

  async function pay(amount: number) {
    // «لم يدفع» on an order already handed over means "not today" — there is
    // nothing to write, so the dialog just closes.
    if (amount <= 0) return { ok: true };

    const result = await recordPayment({ orderId, amount });
    if (result.ok) {
      toast.success("تم تسجيل الدفع");
      router.refresh();
    }
    // A failure stays inside the dialog — money never fades away in a toast.
    return result;
  }

  return (
    <div className="flex items-center gap-4">
      {amountDue > 0 && (
        <CardAction
          variant="brand"
          icon="walletAdd"
          grow
          onClick={() => setCollecting(true)}
        >
          دفع
        </CardAction>
      )}

      {/* Not a control yet: the invoice screen (A-6x) is designed, not built.
          It takes the whole row on a settled order, which is the design. */}
      <CardAction
        variant="outline"
        icon="invoice"
        grow={amountDue <= 0}
        interactive={false}
      >
        عرض الفاتورة
      </CardAction>

      <PaymentDialog
        open={collecting}
        onClose={() => setCollecting(false)}
        amountDue={amountDue}
        onConfirm={pay}
      />
    </div>
  );
}
