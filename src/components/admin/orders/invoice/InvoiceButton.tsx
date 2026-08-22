"use client";

import { useState } from "react";
import { CardAction } from "@/components/ui";
import type { Invoice } from "@/lib/calculations/invoice";
import type { OrderListItem } from "@/lib/queries/orders";
import { RecordPaymentDialog } from "../RecordPaymentDialog";
import { InvoiceSheet } from "./InvoiceSheet";

/**
 * «الفاتورة» on an order card, and everything behind it: the sheet, and the
 * payment it can take. One component because every card that shows the invoice
 * offers exactly the same thing behind it.
 *
 * `label` differs by card only in wording — «الفاتورة» while the order is still
 * in hand, «عرض الفاتورة» once it is done and reading it is all that's left.
 */
export function InvoiceButton({
  order,
  invoice,
  unitPrice,
  cleaningPrice,
  label = "الفاتورة",
  grow = false,
}: {
  order: OrderListItem;
  invoice: Invoice;
  unitPrice: number;
  cleaningPrice: number;
  label?: string;
  grow?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  return (
    <>
      <CardAction
        variant="outline"
        icon="invoice"
        grow={grow}
        onClick={() => setOpen(true)}
      >
        {label}
      </CardAction>

      <InvoiceSheet
        open={open}
        onClose={() => setOpen(false)}
        order={order}
        invoice={invoice}
        unitPrice={unitPrice}
        cleaningPrice={cleaningPrice}
        onPay={() => setPaying(true)}
      />

      {/* Not mounted for a house order: nothing can open it (the sheet has no
          «دفع» there), and a payment dialog that exists for an order nobody
          pays for is one refactor away from being reachable. */}
      {!order.isHouse && (
        <RecordPaymentDialog
          open={paying}
          onClose={() => setPaying(false)}
          orderId={order.id}
          amountDue={Math.max(0, invoice.remaining)}
        />
      )}
    </>
  );
}
