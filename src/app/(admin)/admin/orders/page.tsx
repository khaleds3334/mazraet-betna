import { redirect } from "next/navigation";
import { SearchField } from "@/components/ui";
import { OrdersToolbar } from "@/components/admin/orders/OrdersToolbar";
import { OrdersBrowser } from "@/components/admin/orders/OrdersBrowser";
import { OrdersEmptyState } from "@/components/admin/orders/OrdersEmptyState";
import { OrderCard } from "@/components/admin/orders/card/OrderCard";
import {
  ADMIN_ORDER_TABS,
  resolveTab,
  type AdminOrderTabKey,
} from "@/lib/constants";
import { getCurrentFarm } from "@/lib/queries/admin";
import { listFarmCustomers } from "@/lib/queries/customers";
import { getDefaultOrdersCycle } from "@/lib/queries/cycles";
import { getFarmSettings } from "@/lib/queries/settings";
import {
  listCycleOrders,
  tallyOrderTabs,
  type OrderListItem,
} from "@/lib/queries/orders";

/** One tab's worth of cards — or the reason it's empty. */
function OrdersPanel({
  orders,
  tab,
  salePrice,
  cleaningPrice,
  weights,
}: {
  orders: OrderListItem[];
  tab: AdminOrderTabKey;
  salePrice: number;
  cleaningPrice: number;
  weights: number[];
}) {
  if (orders.length === 0) return <OrdersEmptyState tab={tab} />;

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <li key={order.id}>
          <OrderCard
            order={order}
            salePrice={salePrice}
            cleaningPrice={cleaningPrice}
            weights={weights}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * Admin orders list (A-50). The orders of one cycle — the running one, or the
 * last one to end — split across the three tabs of FR-12, each showing its count.
 *
 * The cycle is read once, whole, and split into the three tabs here. Every tab
 * is rendered on the server and handed to `OrdersBrowser` together, so choosing
 * one is instant and costs nothing (D-31). `loading.tsx` covers the first read;
 * after that there is nothing left to wait for.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const farm = await getCurrentFarm();
  if (!farm) redirect("/logout");

  const [{ tab }, cycle, customers, settings] = await Promise.all([
    searchParams,
    getDefaultOrdersCycle(farm.farmId),
    listFarmCustomers(farm.farmId),
    getFarmSettings(farm.farmId),
  ]);

  // A farm with no cycle yet has no orders either — the same empty state, with
  // every count at zero.
  const orders = cycle ? await listCycleOrders(farm.farmId, cycle) : [];

  const panels = Object.fromEntries(
    ADMIN_ORDER_TABS.map((group) => [
      group.key,
      <OrdersPanel
        key={group.key}
        tab={group.key}
        orders={orders.filter((order) => group.statuses.includes(order.status))}
        salePrice={settings.salePrice}
        cleaningPrice={settings.cleaningPrice}
        weights={settings.availableWeights}
      />,
    ]),
  ) as Record<AdminOrderTabKey, React.ReactNode>;

  return (
    // One scroll container, not two. The screen used to put a scrollable list
    // inside the already-scrollable <main>, and nesting two of them is what made
    // the header drift: a swipe can move either box, and whichever the browser
    // picks, the other still has slack left to give. So the cards simply flow in
    // <main>, and the header is held in place with `sticky` — the list moves
    // underneath it because there is nothing else that *can* move.
    <div className="flex flex-col">
      <OrdersBrowser
        initialTab={resolveTab(tab)}
        counts={tallyOrderTabs(orders)}
        panels={panels}
        header={
          <>
            <OrdersToolbar
              customers={customers}
              weights={settings.availableWeights}
              defaultCleaning={settings.defaultCleaning}
              saleOpen={cycle?.saleOpen ?? false}
            />
            <div className="px-screen">
              {/* Static until the list it would filter is wired — see SearchField. */}
              <SearchField placeholder="ابحث باسم العميل او رقم الطلب" />
            </div>
          </>
        }
      />
    </div>
  );
}
