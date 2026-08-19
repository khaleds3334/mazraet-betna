"use client";

import { useRouter } from "next/navigation";
import { recordPayment } from "@/lib/actions/payments";
import { useToast } from "@/hooks/useToast";
import { PaymentDialog } from "./PaymentDialog";

/**
 * Taking an instalment against an order that already has a price (FR-17) — from
 * the card once it has been handed over, and from the invoice sheet at any point
 * after the weighing.
 *
 * Wraps `PaymentDialog` with the one action it always means here. The dialog
 * itself stays ignorant of what a payment is for, which is what lets the
 * delivery step reuse it against a different action entirely.
 */
export function RecordPaymentDialog({
  open,
  onClose,
  orderId,
  amountDue,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  amountDue: number;
}) {
  const router = useRouter();
  const toast = useToast();

  async function pay(amount: number) {
    // «لم يدفع» here means "not today" — there is nothing to write, so the
    // dialog just closes.
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
    <PaymentDialog
      open={open}
      onClose={onClose}
      amountDue={amountDue}
      onConfirm={pay}
    />
  );
}
