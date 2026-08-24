import { redirect } from "next/navigation";
import { ComingSoon } from "@/components/ui";
import { TrackingEmpty } from "@/components/customer/TrackingEmpty";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getActiveSaleState } from "@/lib/queries/cycles";
import { countActiveOrders } from "@/lib/queries/orders";

/**
 * C-30 — order tracking. Only the "nothing running" state is built so far; the
 * status cards (C-31→C-35) are the next step.
 *
 * `pb-nav-extra` covers the «الطلبات السابقة» button the bar grows on this
 * section: <main> pads for the plain bar, and this page owes the difference.
 */
export default async function TrackingPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/logout");

  const [activeOrders, sale] = await Promise.all([
    countActiveOrders(customer.id),
    getActiveSaleState(customer.farmId),
  ]);

  if (activeOrders > 0) return <ComingSoon title="تتبع الطلب" />;

  return (
    <div className="flex flex-1 flex-col pb-nav-extra">
      {/* `my-auto` and not `justify-center`: it centres the block in whatever
          height is left, and collapses to zero rather than overflowing when a
          short screen leaves none — so nothing can end up above the scroll. */}
      <div className="my-auto">
        <TrackingEmpty saleOpen={sale?.saleOpen ?? false} />
      </div>
    </div>
  );
}
