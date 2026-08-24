import { notFound, redirect } from "next/navigation";
import { ComingSoon, PageHeader } from "@/components/ui";
import { ContactButton } from "@/components/customer/ContactButton";
import { OrderInvoiceView } from "@/components/customer/tracking/OrderInvoiceView";
import { OrderReview } from "@/components/customer/tracking/OrderReview";
import type { TrackedStage } from "@/components/customer/tracking/OrderTrackStrip";
import { orderStage } from "@/lib/constants";
import { formatArabicDate, formatArabicTime } from "@/lib/format";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getOrder } from "@/lib/queries/orders";

/** The stages that swap the timeline for the invoice (C-41→C-44). */
const TRACKED: TrackedStage[] = ["weighed", "cleaning", "ready"];

/**
 * C-40→C-44 — one order's details and invoice.
 *
 * **Two layouts, not five states.** Under review the screen is the four stages
 * written out at length (C-40) — there is nothing else to say yet. From the
 * moment the birds are weighed the invoice IS the order (D-05), so the stages
 * shrink to one strip and the bill takes the page (C-41→C-44). What differs
 * between those three is the pill, one button and one mark on the strip.
 *
 * Delivered and cancelled orders belong to «الطلبات السابقة» and are not built
 * yet (C-45, C-46).
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

  const stage = orderStage(order);
  const tracked = TRACKED.find((candidate) => candidate === stage);

  if (stage !== "pending" && !tracked) {
    return <ComingSoon title="تفاصيل الطلب" />;
  }

  const placedAt = new Date(order.createdAt);

  return (
    <div className="-mb-nav flex flex-1 flex-col gap-8 pb-contact">
      {/* Which order you are looking at stays on screen while the rest
          scrolls under it. Its own `bg-background` — without one the content
          would show through as it passes underneath. */}
      <div className="sticky top-0 z-20 flex flex-col gap-6 bg-background pb-2">
        <PageHeader
          title="تفاصيل الطلب"
          backHref="/tracking"
          className="px-screen pt-4"
        />

        <div className="flex flex-col gap-1 text-center">
          <p className="text-sm text-accent-tan">طلب رقم {order.number}#</p>
          <p className="text-xs text-timestamp">
            في {formatArabicDate(placedAt)} الساعة{" "}
            {formatArabicTime(
              `${placedAt.getHours()}:${String(placedAt.getMinutes()).padStart(2, "0")}`,
            )}
          </p>
        </div>
      </div>

      {tracked ? (
        <OrderInvoiceView order={order} stage={tracked} />
      ) : (
        <OrderReview order={order} />
      )}

      {/* Floats rather than scrolling away, like the pill on home. Full-width
          strip so it centres on the app column, `justify-end` to park it at the
          inline end (the left in RTL), and taps pass through everywhere but the
          pill itself. */}
      <div
        className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-[430px] justify-end px-screen"
        style={{ bottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        <ContactButton className="pointer-events-auto" />
      </div>
    </div>
  );
}
