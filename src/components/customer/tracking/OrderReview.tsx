import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { PICKUP_UNSET } from "@/lib/constants";
import { formatWeight, pluralizeChicken } from "@/lib/format";
import type { OrderListItem } from "@/lib/queries/orders";
import { OrderSteps } from "./OrderSteps";

/**
 * C-40 — the order while it is still under review: what was asked for, and how
 * far along the four stages it has got.
 *
 * It repeats the order back because there is nothing else to report yet — no
 * weights, no price, no bill. The moment the birds are on the scale this whole
 * body is replaced by `OrderInvoiceView`.
 */
export function OrderReview({ order }: { order: OrderListItem }) {
  const rows = [
    {
      label: "عدد الفراخ المطلوبة",
      value: pluralizeChicken(order.chickenCount),
    },
    {
      label: "الاوزان المطلوبة",
      value:
        order.approxWeight != null
          ? formatWeight(order.approxWeight)
          : "اوزان مختلفة",
    },
    { label: "معاد تجهيز الفراخ", value: order.pickupTimeLabel ?? PICKUP_UNSET },
  ];

  return (
    <div className="flex flex-col gap-8">
      <dl className="flex flex-col gap-[7px] px-screen text-foreground">
        {/* RTL: the first child of a `justify-between` row lands on the RIGHT,
            where the design puts the label — so the label is written first. */}
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className="text-base font-bold">{row.label}</dt>
            <dd className="text-base font-bold">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="px-screen">
        <OrderSteps
          activeStep={0}
          badge={<OrderStatusBadge stage="pending" viewer="customer" />}
        />
      </div>
    </div>
  );
}
