"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CardAction } from "@/components/ui";
import type { IconName } from "@/lib/icons";
import { advanceOrder } from "@/lib/actions/orders";
import { deliverOrder } from "@/lib/actions/payments";
import { useToast } from "@/hooks/useToast";
import type { Invoice } from "@/lib/calculations/invoice";
import type { OrderListItem } from "@/lib/queries/orders";
import { PaymentDialog } from "../PaymentDialog";
import { InvoiceButton } from "../invoice/InvoiceButton";

/**
 * What a weighed order's card offers next (A-50): one button that hands the
 * order on, and the invoice beside it.
 *
 * The two stages differ in wording and in weight — lime while the birds are
 * still being prepared, dark green for the last step, which is the one the admin
 * should not tap by mistake. They differ in one more way that matters: handing
 * the birds over is when the money is settled, so that step asks what was paid
 * before it closes the order (FR-17). Unless nothing is owed — then the question
 * has no answer to give, and the order simply closes.
 */
const STAGE = {
  weighed: {
    label: "جاهز للاستلام",
    icon: "checkDouble",
    done: "الطلب بقى جاهز للاستلام",
    variant: "primary",
  },
  ready: {
    label: "تم استلام الطلب",
    icon: "delivered",
    done: "الطلب اتسلّم",
    variant: "brand",
  },
} as const satisfies Record<
  string,
  { label: string; icon: IconName; done: string; variant: "primary" | "brand" }
>;

export function OrderStageActions({
  order,
  stage,
  invoice,
  unitPrice,
  cleaningPrice,
}: {
  order: OrderListItem;
  stage: keyof typeof STAGE;
  invoice: Invoice;
  unitPrice: number;
  cleaningPrice: number;
}) {
  const orderId = order.id;
  const amountDue = Math.max(0, invoice.remaining);
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const step = STAGE[stage];

  async function markReady() {
    setSaving(true);
    const result = await advanceOrder(orderId, "ready");
    setSaving(false);

    if (!result.ok) {
      // Nothing about the money moved and the card still shows the true state,
      // so a toast carries the right weight here (rule 11).
      toast.error(result.error);
      return;
    }
    toast.success(step.done);
    router.refresh();
  }

  async function deliver(amount: number) {
    setSaving(true);
    const result = await deliverOrder({ orderId, amount });
    setSaving(false);

    if (result.ok) {
      toast.success(step.done);
      router.refresh();
    }
    // A failure stays inside the dialog — money never fades away in a toast.
    return result;
  }

  function onPrimary() {
    if (stage === "weighed") return markReady();
    // Nothing owed, so there is no question to ask — the order just closes. It
    // still writes, so it still has to look like it is writing.
    if (amountDue > 0) return setCollecting(true);
    return void deliver(0);
  }

  return (
    <div className="flex items-center gap-4">
      <CardAction
        variant={step.variant}
        icon={step.icon}
        grow
        onClick={onPrimary}
        isLoading={saving}
      >
        {step.label}
      </CardAction>

      <InvoiceButton
        order={order}
        invoice={invoice}
        unitPrice={unitPrice}
        cleaningPrice={cleaningPrice}
      />

      <PaymentDialog
        open={collecting}
        onClose={() => setCollecting(false)}
        amountDue={amountDue}
        onConfirm={deliver}
      />
    </div>
  );
}
