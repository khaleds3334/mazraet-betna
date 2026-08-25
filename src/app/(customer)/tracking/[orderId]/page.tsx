import { notFound, redirect } from "next/navigation";
import { ComingSoon, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ContactButton } from "@/components/customer/ContactButton";
import { JumpToWeights } from "@/components/customer/tracking/JumpToWeights";
import { OrderInvoiceView } from "@/components/customer/tracking/OrderInvoiceView";
import { OrderReview } from "@/components/customer/tracking/OrderReview";
import type { TrackedStage } from "@/components/customer/tracking/OrderTrackStrip";
import { orderStage } from "@/lib/constants";
import { formatArabicDate, formatArabicTime } from "@/lib/format";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getOrder } from "@/lib/queries/orders";

/** The stages that swap the timeline for the invoice (C-41→C-46). */
const TRACKED: TrackedStage[] = ["weighed", "cleaning", "ready", "delivered"];

/**
 * C-40→C-46 — one order's details and invoice.
 *
 * **Two layouts, not five states.** Under review the screen is the four stages
 * written out at length (C-40) — there is nothing else to say yet. From the
 * moment the birds are weighed the invoice IS the order (D-05), so the stages
 * shrink to one strip and the bill takes the page (C-41→C-44). What differs
 * between those three is the pill, one button and one mark on the strip.
 *
 * A delivered order (C-45/C-46) is that same second layout with the money in
 * the head — it is walked into from «الطلبات السابقة», and the invoice it shows
 * has not changed since the scale.
 *
 * A cancelled one has no screen: nothing was weighed, so there is no invoice and
 * no weights, and its history card says all there is to say and deliberately
 * leads nowhere. Reachable only by typing the URL, which is what `ComingSoon`
 * is still here for.
 *
 * A screen walked into, not tabbed to: back button, no bottom bar. `-mb-nav`
 * gives back the room <main> reserves for the bar that `BottomNav` stands down.
 *
 * **«تواصل معنا» goes once the order is delivered** (Khaled, 2026-08-25), paid
 * for or not. The pill is there for an order something can still be done about;
 * on a finished one there is nothing to ask the farm — and if money is still
 * owed, a call button floating over the amount reads as the farm chasing him for
 * it. The page's bottom padding is that pill's clearance, so it goes with it.
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

  // Cancelled — see above.
  if (stage !== "pending" && !tracked) {
    return <ComingSoon title="تفاصيل الطلب" />;
  }

  const placedAt = new Date(order.createdAt);
  const done = stage === "delivered";

  return (
    <div
      className={cn(
        "-mb-nav flex flex-1 flex-col gap-6",
        // The pill's clearance while there is a pill; otherwise just enough that
        // «عرض الاوزان بالتفصيل» does not sit on the edge of the screen.
        done ? "pb-8" : "pb-contact",
      )}
    >
      {/* Which order you are looking at stays on screen while the rest
          scrolls under it. Its own `bg-background` — without one the content
          would show through as it passes underneath.

          `data-sticky-header` is how anything scrolling this page finds out
          how much of the top is already spoken for — `WeightsDisclosure`
          measures it instead of carrying a copy of this block's height. */}
      <div data-sticky-header className="sticky top-0 z-20 flex flex-col gap-4 bg-background pb-2">
        <PageHeader
          title="تفاصيل الطلب"
          // Back to wherever this order lives: a finished one was walked into
          // from «الطلبات السابقة», and returning him to the tracking list —
          // which by definition no longer holds it — would look like it had
          // vanished.
          backHref={stage === "delivered" ? "/history" : "/tracking"}
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
          buttons themselves.

          Two of them, and RTL puts the first on the right: the round way down to
          the weights sits inboard of «تواصل معنا», which stays on the edge it
          has on every other screen. On a finished order the pill is gone and the
          circle keeps the corner to itself. */}
      <div
        className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-[430px] items-center justify-end gap-2 px-screen"
        style={{ bottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        <JumpToWeights />
        {!done && <ContactButton className="pointer-events-auto" />}
      </div>
    </div>
  );
}
