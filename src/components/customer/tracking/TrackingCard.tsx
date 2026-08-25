import {
  OrderCardRows,
  OrderCardShell,
} from "@/components/customer/OrderCardShell";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { computeInvoice } from "@/lib/calculations/invoice";
import { orderStage, type OrderStage } from "@/lib/constants";
import { formatCurrency, formatWeight, pluralizeChicken } from "@/lib/format";
import type { OrderListItem } from "@/lib/queries/orders";

/** One label/value line in the card's middle block. */
type Row = React.ComponentProps<typeof OrderCardRows>["rows"][number];

/**
 * The customer's order card on the tracking screen (C-31→C-35). Tapping it
 * opens that order's details and invoice.
 *
 * **What it says changes with the status, because what matters changes.** While
 * the order is under review it repeats what was asked for — there is nothing
 * else to report yet. Once the birds are on the scale the plan stops being the
 * news and the invoice takes over (D-05), so the card shows the weight and the
 * price. Once it is ready, the only open question is money, so it shows the
 * price and what has been paid.
 *
 * It reads a **stage**, not a status: once the customer has confirmed the price
 * the card says «يتم الذبح و التنظيف» (C-33), and that is a stage the database
 * has no status for — see `orderStage`.
 *
 * The card's shape is `OrderCardShell`, shared with the history list (C-51).
 * This file owns only what a running order has to say.
 */
export function TrackingCard({ order }: { order: OrderListItem }) {
  const invoice = computeInvoice(
    {
      unit_price: order.weighing.unitPrice ?? 0,
      cleaning_price: order.weighing.cleaningPrice ?? 0,
    },
    order.weighing.lines.map((line) => ({
      id: line.id,
      batch_no: line.batchNo,
      position: line.position,
      actual_weight: line.actualWeight,
      cleaning: line.cleaning,
    })),
    order.payments,
  );

  const count = pluralizeChicken(order.chickenCount);
  const onScale = order.weighing.lines.filter(
    (line) => line.actualWeight != null,
  ).length;
  const weighedBirds = {
    count: onScale,
    average: onScale > 0 ? invoice.totalWeight / onScale : 0,
  };
  // `ready` also catches delivered and cancelled, and neither reaches this
  // screen — tracking lists the orders that are still running.
  const stage = orderStage(order);
  const reading: ReadingKey = reads(stage) ? stage : "ready";
  const { rows, hint, hintCentred } = READING[reading]({
    order,
    invoice,
    count,
    weighedBirds,
  });

  return (
    <OrderCardShell
      href={`/tracking/${order.id}`}
      number={order.number}
      placedAt={order.createdAt}
      badges={<OrderStatusBadge stage={stage} viewer="customer" />}
      hint={hint}
      hintCentred={hintCentred}
    >
      <OrderCardRows rows={rows} />
    </OrderCardShell>
  );
}

type ReadingInput = {
  order: OrderListItem;
  invoice: ReturnType<typeof computeInvoice>;
  count: string;
  /** How many birds actually made it onto the scale, and what they averaged. */
  weighedBirds: { count: number; average: number };
};

/** The stages an order can be at while it is still on the tracking screen. */
type ReadingKey = Extract<
  OrderStage,
  "pending" | "weighed" | "cleaning" | "ready"
>;

const reads = (stage: OrderStage): stage is ReadingKey => stage in READING;

const READING: Record<
  ReadingKey,
  (input: ReadingInput) => { rows: Row[]; hint: string; hintCentred?: boolean }
> = {
  pending: ({ order, count }) => ({
    rows: [
      { label: "عدد الفراخ المطلوبة", value: count, strong: true },
      {
        label: "الاوزان المطلوبة",
        value:
          order.approxWeight != null
            ? formatWeight(order.approxWeight)
            : "اوزان مختلفة",
      },
      { label: "معاد تجهيز الفراخ", value: order.pickupTimeLabel ?? "—" },
    ],
    hint: "يتم الان التأكد من توفر الاوزان المطلوبة",
  }),

  weighed: ({ invoice, count, weighedBirds }) => ({
    rows: [
      { label: "عدد الفراخ المطلوبة", value: count, strong: true },
      {
        // Birds are weighed one by one and no two match, so the multiplier is
        // their average — which is the total back again, shown the long way so
        // the customer can see where it came from.
        label: "اجمالي الوزن",
        value: `${pluralizeChicken(weighedBirds.count)} × ${formatWeight(weighedBirds.average, { withUnit: false })} كجم = ${formatWeight(invoice.totalWeight)}`,
        small: true,
      },
      {
        label: "السعر النهائي",
        value: formatCurrency(invoice.total),
        strong: true,
      },
    ],
    hint: "انظر الي الفاتورة لمعرفة التفاصيل و تأكيد الطلب",
    hintCentred: true,
  }),

  // The same three figures as «جاهز للاستلام»: the invoice is settled and the
  // only thing still moving is the birds. What changes is the sentence.
  cleaning: ({ invoice, count }) => ({
    rows: [
      { label: "عدد الفراخ المطلوبة", value: count, strong: true },
      {
        label: "السعر النهائي",
        value: formatCurrency(invoice.total),
        strong: true,
      },
      {
        label: "المبلغ المدفوع",
        value: formatCurrency(invoice.paid),
        strong: true,
      },
    ],
    hint: "يتم الان تنظيف الطلب و سيكون جاهز قريبا",
  }),

  ready: ({ invoice, count }) => ({
    rows: [
      { label: "عدد الفراخ المطلوبة", value: count, strong: true },
      {
        label: "السعر النهائي",
        value: formatCurrency(invoice.total),
        strong: true,
      },
      {
        label: "المبلغ المدفوع",
        value: formatCurrency(invoice.paid),
        strong: true,
      },
    ],
    hint: "الطلب الان جاهز للاستلام يمكنك التوجة للمزرعة",
    hintCentred: true,
  }),
};
