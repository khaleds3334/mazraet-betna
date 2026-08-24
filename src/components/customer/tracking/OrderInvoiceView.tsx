import { InvoiceSection } from "@/components/shared/invoice/InvoiceSection";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { computeInvoice } from "@/lib/calculations/invoice";
import type { OrderListItem } from "@/lib/queries/orders";
import { ConfirmPriceButton } from "./ConfirmPriceButton";
import { OrderTrackStrip, type TrackedStage } from "./OrderTrackStrip";
import { WeightsDisclosure } from "./WeightsDisclosure";

/**
 * C-41→C-44 — the second half of the order-details screen: everything from
 * «تم وزن الفراخ» onwards.
 *
 * **A different screen, not a different state.** Under review (C-40) there is
 * nothing to price, so the screen is the four stages written out at length. The
 * moment the birds are weighed the invoice IS the order (D-05), so the stages
 * shrink to one strip and the bill takes the page.
 *
 * The invoice itself is not written here — `InvoiceSection` and
 * `WeightsSection` are the same components the admin's invoice sheet shows, so
 * the two apps can never quote the same order at different numbers.
 */
export function OrderInvoiceView({
  order,
  stage,
}: {
  order: OrderListItem;
  stage: TrackedStage;
}) {
  const unitPrice = order.weighing.unitPrice ?? 0;
  const cleaningPrice = order.weighing.cleaningPrice ?? 0;
  const invoice = computeInvoice(
    { unit_price: unitPrice, cleaning_price: cleaningPrice },
    order.weighing.lines.map((line) => ({
      id: line.id,
      batch_no: line.batchNo,
      position: line.position,
      actual_weight: line.actualWeight,
      cleaning: line.cleaning,
    })),
    order.payments,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4 px-screen">
        {/* RTL: the first child of a `justify-between` row lands on the RIGHT,
            which is where the design puts the pill — so the pill is written
            first and the button, on the left, second. With the button gone the
            row has one child and the pill stays where it was. */}
        <div className="flex w-full items-center justify-between gap-3">
          <OrderStatusBadge stage={stage} viewer="customer" />

          {/* Only while the price is waiting on him. Once confirmed the button
              has done its job, and the design drops it (C-42, C-43). */}
          {stage === "weighed" && <ConfirmPriceButton orderId={order.id} />}
        </div>

        <OrderTrackStrip stage={stage} />
      </div>

      <InvoiceSection
        invoice={invoice}
        unitPrice={unitPrice}
        cleaningPrice={cleaningPrice}
        // The design adds المدفوع / المتبقي on «جاهز للاستلام», where collecting
        // the birds is about to mean paying for them. Money that has already
        // moved is shown whenever it has: a customer who paid a deposit at the
        // scale must see it counted before he is asked for the rest.
        showPayments={stage === "ready" || invoice.paid > 0}
      />

      {/* 24px under the card rather than the 16 the column runs on: the table
          is a different thing from the bill, not the next line of it. */}
      <div className="pt-2">
        <WeightsDisclosure invoice={invoice} />
      </div>
    </div>
  );
}
