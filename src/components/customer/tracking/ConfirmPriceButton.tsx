"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmOrderPrice } from "@/lib/actions/customerOrders";
import { useToast } from "@/hooks/useToast";

/**
 * «التأكيد و الذبح» (C-41) — the customer has read the invoice and lets the farm
 * go ahead. One tap moves the order to «يتم الذبح و التنظيف» and the button is
 * gone from the screen it comes back on, because the stage it belongs to has
 * passed.
 *
 * Grey, not lime, and that is the design: the loud thing on this screen is the
 * invoice, and this button is agreement with it rather than a call to action.
 *
 * Disabled while the action is in flight, and the label says why — a customer
 * who gets no answer taps again, which is the whole reason rule 11 exists. The
 * second tap would be harmless anyway (`confirm_order_price` is idempotent), but
 * "harmless" is not the same as "answered".
 */
export function ConfirmPriceButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [sending, setSending] = useState(false);

  async function confirm() {
    setSending(true);
    const result = await confirmOrderPrice(orderId);

    if (!result.ok) {
      setSending(false);
      toast.error(result.error);
      return;
    }

    toast.success("تم تأكيد الطلب، هيتم تجهيزه دلوقتي");
    // Left as `sending` on purpose: the refresh replaces this screen with the
    // «يتم الذبح و التنظيف» one, and a button that comes back to life for the
    // moment in between invites the tap it no longer needs.
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={confirm}
      disabled={sending}
      aria-busy={sending || undefined}
      className="flex min-h-10 shrink-0 items-center justify-center rounded-md border border-control-border bg-control-border px-3 text-base text-foreground disabled:opacity-60"
    >
      <span className="optical-center">
        {sending ? "بنأكد الطلب…" : "التأكيد و الذبح"}
      </span>
    </button>
  );
}
