import { InvoiceSection } from "@/components/shared/invoice/InvoiceSection";
import { computeInvoice } from "@/lib/calculations/invoice";
import type { OrderListItem } from "@/lib/queries/orders";
import { OrderStatusHead } from "./OrderStatusHead";
import { OrderTrackStrip, type TrackedStage } from "./OrderTrackStrip";
import { WeightsDisclosure } from "./WeightsDisclosure";

/**
 * C-41→C-46 — the second half of the order-details screen: everything from
 * «تم وزن الفراخ» onwards, including the two the order ends on.
 *
 * **A different screen, not a different state.** Under review (C-40) there is
 * nothing to price, so the screen is the four stages written out at length. The
 * moment the birds are weighed the invoice IS the order (D-05), so the stages
 * shrink to one strip and the bill takes the page.
 *
 * The invoice itself is not written here — `InvoiceSection` and
 * `WeightsSection` are the same components the admin's invoice sheet shows, so
 * the two apps can never quote the same order at different numbers.
 *
 * **A delivered order (C-45/C-46) is the same page, four things later.** The
 * invoice does not change when the birds are handed over — it was final at the
 * scale (D-05) — so the bill, the weights table and the strip are the ones
 * already here. What differs is the head, which stops reporting a status and
 * starts reporting money, and the payment lines, which now always show.
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
        <OrderStatusHead
          stage={stage}
          orderId={order.id}
          deliveredAt={order.deliveredAt}
          remaining={invoice.remaining}
          isHouse={order.isHouse}
        />

        <OrderTrackStrip stage={stage} />
      </div>

      <InvoiceSection
        invoice={invoice}
        unitPrice={unitPrice}
        cleaningPrice={cleaningPrice}
        // Only once money has actually moved (Khaled, 2026-08-25). The design
        // draws المدفوع / المتبقي on «جاهز للاستلام», but on an order nobody has
        // paid a piaster of, «المبلغ المدفوع ٠ جنيه» and «المبلغ المتبقي ١٣٠٤
        // جنيه» are two lines repeating the total above them — and the second
        // reads as a debt to a customer who has not been asked for anything yet.
        // A deposit paid at the scale still shows, at any stage.
        //
        // A delivered order shows them either way: it is over, the money is the
        // only thing left to be true or not, and «المبلغ المتبقي ١٣٠٤ جنيه» on
        // an order nobody paid for is exactly the sentence he opened the screen
        // to read (C-45/C-46).
        showPayments={stage === "delivered" || invoice.paid > 0}
      />

      {/* 24px under the card rather than the 16 the column runs on: the table
          is a different thing from the bill, not the next line of it. */}
      <div>
        <WeightsDisclosure invoice={invoice} />
      </div>
    </div>
  );
}
