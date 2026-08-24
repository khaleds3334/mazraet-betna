import { notFound, redirect } from "next/navigation";
import { ComingSoon, PageHeader } from "@/components/ui";
import { ContactButton } from "@/components/customer/ContactButton";
import { OrderSteps } from "@/components/customer/tracking/OrderSteps";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import {
  formatArabicDate,
  formatArabicTime,
  formatWeight,
  pluralizeChicken,
} from "@/lib/format";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getOrder } from "@/lib/queries/orders";

/**
 * C-40→C-44 — one order's details and invoice.
 *
 * Only the review state (C-40) is built: what was asked for, and how far along
 * the four stages it has got. Everything from «تم الوزن» onwards swaps the
 * timeline for a compact strip and adds the invoice — that is the next step.
 *
 * A screen walked into, not tabbed to: back button, no bottom bar. `-mb-nav`
 * gives back the room <main> reserves for the bar that `BottomNav` stands down.
 */
export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/logout");

  const order = await getOrder(customer.farmId, orderId);
  // RLS already limits the read to this customer's own orders; a miss here is
  // either a bad id or somebody else's order, and both are "no such page".
  if (!order) notFound();

  if (order.status !== "pending") {
    return <ComingSoon title="تفاصيل الطلب" />;
  }

  const placedAt = new Date(order.createdAt);

  return (
    <div className="-mb-nav flex flex-1 flex-col gap-8 pb-6">
      <PageHeader
        title="تفاصيل الطلب"
        backHref="/tracking"
        className="px-screen pt-4"
      />

      <div className="flex flex-col gap-6 px-screen">
        <div className="flex flex-col gap-1 text-center">
          <p className="text-sm text-accent-tan">طلب رقم {order.number}#</p>
          <p className="text-xs text-timestamp">
            في {formatArabicDate(placedAt)} الساعة{" "}
            {formatArabicTime(
              `${placedAt.getHours()}:${String(placedAt.getMinutes()).padStart(2, "0")}`,
            )}
          </p>
        </div>

        <dl className="flex flex-col gap-[7px] text-foreground">
          {[
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
            {
              label: "معاد تجهيز الفراخ",
              value: order.pickupTimeLabel ?? "—",
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <dt className="text-base font-bold">{row.label}</dt>
              <dd className="text-sm">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="px-screen">
        <OrderSteps
          activeStep={0}
          badge={<OrderStatusBadge status={order.status} viewer="customer" />}
        />
      </div>

      {/* `justify-end` is the inline end, which in RTL is the left — where the
          design parks it, same as on the home screen. */}
      <div className="flex justify-end px-screen">
        <ContactButton />
      </div>
    </div>
  );
}
