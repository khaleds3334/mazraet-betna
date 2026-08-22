"use client";

import { useState } from "react";
import { CardAction } from "@/components/ui";
import type { Invoice } from "@/lib/calculations/invoice";
import type { OrderListItem } from "@/lib/queries/orders";
import { RecordPaymentDialog } from "../RecordPaymentDialog";
import { InvoiceButton } from "../invoice/InvoiceButton";

/**
 * A delivered order's card (A-50). The birds are gone, so the only thing left to
 * do with it is money: read the invoice, and — while anything is still owed —
 * take another instalment (FR-17). A settled order shows the invoice alone, and
 * it takes the whole row.
 *
 * **A house order is never owed.** The family's own birds leave the flock like
 * any other order but were never a sale (FR-36): no revenue, no debt, nobody to
 * collect from. «دفع» on one asks the admin to pay himself (Khaled, 2026-08-22).
 */
export function DeliveredOrderActions({
  order,
  invoice,
  unitPrice,
  cleaningPrice,
}: {
  order: OrderListItem;
  invoice: Invoice;
  unitPrice: number;
  cleaningPrice: number;
}) {
  const [paying, setPaying] = useState(false);
  const amountDue = order.isHouse ? 0 : Math.max(0, invoice.remaining);

  return (
    <div className="flex items-center gap-4">
      {amountDue > 0 && (
        <CardAction
          variant="brand"
          icon="walletAdd"
          grow
          onClick={() => setPaying(true)}
        >
          دفع
        </CardAction>
      )}

      <InvoiceButton
        order={order}
        invoice={invoice}
        unitPrice={unitPrice}
        cleaningPrice={cleaningPrice}
        label="عرض الفاتورة"
        grow={amountDue <= 0}
      />

      <RecordPaymentDialog
        open={paying}
        onClose={() => setPaying(false)}
        orderId={order.id}
        amountDue={amountDue}
      />
    </div>
  );
}
