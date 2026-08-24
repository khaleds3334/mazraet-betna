import { redirect } from "next/navigation";
import { IconRing } from "@/components/ui";
import { EmptyOrders } from "@/components/customer/EmptyOrders";
import { TrackingCard } from "@/components/customer/tracking/TrackingCard";
import type { IconName } from "@/lib/icons";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getActiveSaleState } from "@/lib/queries/cycles";
import { listCustomerActiveOrders } from "@/lib/queries/orders";
import type { OrderStatus } from "@/lib/constants";

/** The mark over a single order — the stage it has reached, in one glyph. */
const STATUS_ICON: Record<OrderStatus, IconName> = {
  pending: "ordersWaiting",
  weighed: "weight",
  ready: "checkDouble",
  // Neither reaches this screen — both belong to «الطلبات السابقة» — but the
  // map is total so a new status can never fall through to nothing.
  delivered: "checkDouble",
  cancelled: "close",
};

/**
 * C-30→C-35 — order tracking.
 *
 * `pb-nav-extra` covers the «الطلبات السابقة» button the bar grows on this
 * section: <main> pads for the plain bar, and this page owes the difference.
 */
export default async function TrackingPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/logout");

  const [orders, sale] = await Promise.all([
    listCustomerActiveOrders(customer.farmId, customer.id),
    getActiveSaleState(customer.farmId),
  ]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-1 flex-col pb-nav-extra">
        {/* `my-auto` and not `justify-center`: it centres the block in whatever
            height is left, and collapses to zero rather than overflowing when a
            short screen leaves none — so nothing can end up above the scroll. */}
        <div className="my-auto">
          <EmptyOrders
            titleLines={["ليس لديك اي طلبات", "نشطة حاليا"]}
            saleOpen={sale?.saleOpen ?? false}
          />
        </div>
      </div>
    );
  }

  // One order gets the glyph over it; a list does not. With several cards the
  // status is already on each of them, and one mark over the top could only
  // describe the first (C-35).
  const single = orders.length === 1 ? orders[0] : null;

  return (
    <div className="flex flex-col gap-4 px-screen pb-calc pt-14">
      {single && (
        <div className="flex justify-center pb-5">
          <IconRing name={STATUS_ICON[single.status]} />
        </div>
      )}

      {orders.map((order) => (
        <TrackingCard key={order.id} order={order} />
      ))}
    </div>
  );
}
