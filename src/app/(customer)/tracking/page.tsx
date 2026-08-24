import { redirect } from "next/navigation";
import { IconRing } from "@/components/ui";
import { EmptyOrders } from "@/components/customer/EmptyOrders";
import { TrackingCard } from "@/components/customer/tracking/TrackingCard";
import type { IconName } from "@/lib/icons";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getActiveSaleState } from "@/lib/queries/cycles";
import { listCustomerActiveOrders } from "@/lib/queries/orders";
import type { OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        "flex flex-1 flex-col gap-4 px-screen pb-24",
        // Only the list starts below the top of the screen. A single order is
        // centred, and top padding would push the whole centring region down
        // with it — it measured 56px low before this was conditional.
        !single && "pt-14",
      )}
    >
      {/* A single order sits dead centre of what is left above the bar and its
          «الطلبات السابقة» button — hence `pb-nav-extra`, which is exactly what
          that button adds. A list does not centre: it starts at the top and
          scrolls. `my-auto` collapses to zero when there is no room, so a short
          screen scrolls instead of hiding the top of the block. */}
      {single ? (
        <div className="my-auto flex flex-col gap-9">
          <div className="flex justify-center">
            <IconRing name={STATUS_ICON[single.status]} />
          </div>
          <TrackingCard order={single} />
        </div>
      ) : (
        orders.map((order) => <TrackingCard key={order.id} order={order} />)
      )}
    </div>
  );
}
