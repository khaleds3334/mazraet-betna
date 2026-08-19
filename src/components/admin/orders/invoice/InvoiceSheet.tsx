"use client";

import { BottomSheet, CardAction, CloseButton } from "@/components/ui";
import { InvoiceSection } from "@/components/shared/invoice/InvoiceSection";
import { WeightsSection } from "@/components/shared/invoice/WeightsSection";
import type { Invoice } from "@/lib/calculations/invoice";
import type { OrderListItem } from "@/lib/queries/orders";
import { formatArabicDate, formatArabicTime } from "@/lib/format";

/** When the birds actually went — replaces «تعديل» once the order is done. */
function DeliveredAt({ at }: { at: string }) {
  const moment = new Date(at);
  const time = `${moment.getHours()}:${String(moment.getMinutes()).padStart(2, "0")}`;

  return (
    // Two lines: the sentence sits between a button and the close control, and
    // on one line it either squeezes them or wraps where it likes.
    <p className="flex flex-col items-center text-center text-sm text-foreground">
      <span>تم تسليم الطلب في</span>
      <span>
        {formatArabicDate(moment, "d MMMM")} الساعة {formatArabicTime(time)}
      </span>
    </p>
  );
}

/**
 * «الفاتورة» (A-63) — the order as a bill: what it came to, and every bird it
 * was reached from. The sheet is the admin's frame around two sections the
 * customer app shows as well, which is why those live in `shared/invoice`.
 *
 * What changes with the order's stage is only the top strip:
 *   • weighed  — the note is still worth reading, and the order can still be edited
 *   • ready    — the note has been acted on, so it goes
 *   • delivered— «تعديل» gives way to when the birds actually went
 * and «دفع» is there whenever anything is still owed, from the weighing on
 * (FR-17) — not just at the door.
 */
export function InvoiceSheet({
  open,
  onClose,
  order,
  invoice,
  unitPrice,
  cleaningPrice,
  onPay,
}: {
  open: boolean;
  onClose: () => void;
  order: OrderListItem;
  invoice: Invoice;
  unitPrice: number;
  cleaningPrice: number;
  /** Opens the payment dialog — owned by the card, which also owns the action. */
  onPay: () => void;
}) {
  const delivered = order.status === "delivered";
  const owing = invoice.remaining > 0;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label="الفاتورة"
      header={
        <div className="flex items-center justify-between gap-3 px-screen py-6">
          {/* Nothing stands in for a missing «دفع»: with it gone the row has two
              children, so what is left starts from the right where the reading
              does, instead of floating in the middle of the gap it vacated. */}
          {owing && (
            // 138px in the design — held as a minimum so a longer word can
            // still grow it rather than being clipped by it.
            <CardAction
              variant="brand"
              icon="walletAdd"
              onClick={onPay}
              className="min-w-[138px]"
            >
              دفع
            </CardAction>
          )}

          {delivered && order.deliveredAt ? (
            <DeliveredAt at={order.deliveredAt} />
          ) : (
            // Inert until editing a weighed order is built (FR-16).
            <CardAction
              variant="outline"
              icon="edit"
              interactive={false}
              className="px-6"
            >
              تعديل
            </CardAction>
          )}

          <CloseButton onClick={onClose} />
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {/* The note is an instruction for preparing the birds, so it stops being
            worth space once they are prepared. */}
        {order.status === "weighed" && order.weighing.notes && (
          <div className="px-screen">
            <p className="rounded-[10px] border border-accent-tan bg-surface-warm px-4 py-2 text-center text-sm text-primary-foreground">
              {order.weighing.notes}
            </p>
          </div>
        )}

        <InvoiceSection
          invoice={invoice}
          unitPrice={unitPrice}
          cleaningPrice={cleaningPrice}
          showPayments={invoice.paid > 0 || delivered}
        />
        <WeightsSection invoice={invoice} />
      </div>
    </BottomSheet>
  );
}
