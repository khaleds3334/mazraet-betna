import Link from "next/link";
import { Icon } from "@/components/ui";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { computeInvoice } from "@/lib/calculations/invoice";
import {
  formatArabicDate,
  formatArabicTime,
  formatCurrency,
  formatWeight,
  pluralizeChicken,
} from "@/lib/format";
import type { OrderListItem } from "@/lib/queries/orders";

/** One label/value line in the card's middle block. */
interface Row {
  label: string;
  value: string;
  /** Counts and money are set in the label's own bold; measurements are not. */
  strong?: boolean;
}

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
 */
export function TrackingCard({ order }: { order: OrderListItem }) {
  const placedAt = new Date(order.createdAt);
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
  const { rows, hint, hintCentred } = READING[
    order.status === "pending"
      ? "pending"
      : order.status === "weighed"
        ? "weighed"
        : "ready"
  ]({ order, invoice, count });

  return (
    <Link
      href={`/tracking/${order.id}`}
      replace
      className="flex flex-col gap-3.5 rounded-xl border border-border bg-surface-page py-[18px] shadow-card"
    >
      {/* In RTL the first child of a `justify-between` row lands on the RIGHT.
          The design puts the order number there and the status pill opposite,
          so the number block is written first. */}
      <div className="flex items-center justify-between px-6">
        {/* No `items-end`: that shrinks each line to its own text and leaves
            the shorter one hanging. Stretching them both and aligning the text
            right is what puts the two on a single right edge, as drawn. */}
        <div className="flex flex-col gap-1 text-right">
          <p className="text-sm text-accent-tan">طلب رقم {order.number}#</p>
          <p className="text-xs text-timestamp">
            في {formatArabicDate(placedAt)} الساعة{" "}
            {formatArabicTime(
              `${placedAt.getHours()}:${String(placedAt.getMinutes()).padStart(2, "0")}`,
            )}
          </p>
        </div>

        <OrderStatusBadge status={order.status} viewer="customer" />
      </div>

      {/* Full-bleed on purpose — the design runs the rule to both edges while
          everything else keeps the card's padding. */}
      <hr className="border-t-[1.5px] border-foreground" />

      <dl className="flex flex-col gap-[7px] px-6 text-foreground">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className="text-base font-bold">{row.label}</dt>
            <dd className={row.strong ? "text-base font-bold" : "text-sm"}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between gap-2 px-6">
        {/* Held to a narrow measure and centred on the two later cards, which is
            how the design breaks it over two lines. `max-w` and not a fixed
            width so it still fits beside the arrow at 320px. */}
        <p
          className={
            hintCentred
              ? "max-w-[195px] text-center text-sm text-foreground"
              : "text-sm text-foreground"
          }
        >
          {hint}
        </p>
        <Icon
          name="openDetails"
          size={35}
          className="shrink-0 text-foreground"
        />
      </div>
    </Link>
  );
}

type ReadingInput = {
  order: OrderListItem;
  invoice: ReturnType<typeof computeInvoice>;
  count: string;
};

const READING: Record<
  "pending" | "weighed" | "ready",
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

  weighed: ({ invoice, count }) => ({
    rows: [
      { label: "عدد الفراخ المطلوبة", value: count, strong: true },
      { label: "اجمالي الوزن", value: formatWeight(invoice.totalWeight) },
      {
        label: "السعر النهائي",
        value: formatCurrency(invoice.total),
        strong: true,
      },
    ],
    hint: "انظر الي الفاتورة لمعرفة التفاصيل و تأكيد الطلب",
    hintCentred: true,
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
