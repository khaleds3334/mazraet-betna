import { redirect } from "next/navigation";
import { SearchField } from "@/components/ui";
import { OrdersToolbar } from "@/components/admin/orders/OrdersToolbar";
import { OrdersBrowser } from "@/components/admin/orders/OrdersBrowser";
import { OrdersShell } from "@/components/admin/orders/OrdersShell";
import { OrdersEmptyState } from "@/components/admin/orders/OrdersEmptyState";
import { OrderCard } from "@/components/admin/orders/card/OrderCard";
import {
  ADMIN_ORDER_TABS,
  defaultOrdersTab,
  parseTab,
  type AdminOrderTabKey,
} from "@/lib/constants";
import { getCurrentFarm } from "@/lib/queries/admin";
import { listFarmCustomers } from "@/lib/queries/customers";
import { listOrdersCycles, pickDefaultCycle } from "@/lib/queries/cycles";
import { getFarmSettings } from "@/lib/queries/settings";
import {
  countOrdersByCycle,
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
 * Admin orders list (A-50). One cycle's orders — the one selling now by default,
 * or whichever the funnel picked — and the screen has two faces depending on
 * which that is:
 *
 * **A cycle that is selling** gets the working screen: «اضافة طلب», and the three
 * tabs of FR-12 each showing its count. Every tab is rendered on the server and
 * handed to `OrdersBrowser` together, so choosing one is instant (D-31).
 *
 * **Any other cycle** is an archive: nothing can be added to it (D-39) and every
 * order in it is finished, so there is one list, labelled with what it came to.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; cycle?: string }>;
}) {
  const farm = await getCurrentFarm();
  if (!farm) redirect("/logout");

  const [params, cycles, orderCounts, customers, settings] = await Promise.all([
    searchParams,
    listOrdersCycles(farm.farmId),
    countOrdersByCycle(farm.farmId),
    listFarmCustomers(farm.farmId),
    getFarmSettings(farm.farmId),
  ]);

  // Whatever the funnel put in the URL, falling back to «الدورة الحالية» (D-38).
  // An id that isn't this farm's simply doesn't match, and the default stands.
  const cycle =
    cycles.find((option) => option.cycleId === params.cycle) ??
    pickDefaultCycle(cycles);

  // A farm with no cycle yet has no orders and nothing to pick between: no
  // toolbar, no tabs, just the sentence saying so.
  if (!cycle) {
    return (
      <div className="flex flex-col px-screen pt-4">
        <OrdersEmptyState tab="new" />
      </div>
    );
  }

  const orders = await listCycleOrders(farm.farmId, cycle);
  const counts = tallyOrderTabs(orders);

  // What the funnel is worth offering. A cycle with no orders opens on an empty
  // screen, and a flock still being raised can never have any (D-39) — so the
  // picker leaves them out. Two exceptions, both about not painting him into a
  // corner: the selling cycle is always reachable, because that is where the next
  // order lands even if none has yet; and the cycle he is looking at never
  // vanishes from the list he chose it in.
  const pickable = cycles.filter(
    (option) =>
      (orderCounts.get(option.cycleId) ?? 0) > 0 ||
      option.saleOpen ||
      option.cycleId === cycle.cycleId,
  );

  const header = (
    <>
      <OrdersToolbar
        cycle={cycle}
        cycles={pickable}
        orderCount={orders.length}
        allDone={counts.done === orders.length}
        customers={customers}
        weights={settings.availableWeights}
        defaultCleaning={settings.defaultCleaning}
      />
      <div className="px-screen">
        {/* Static until the list it would filter is wired — see SearchField. */}
        <SearchField placeholder="ابحث باسم العميل او رقم الطلب" />
      </div>
    </>
  );

  if (!cycle.saleOpen) {
    return (
      <div className="flex flex-col">
        <OrdersShell header={header}>
          <OrdersPanel
            orders={orders}
            tab="done"
            salePrice={settings.salePrice}
            cleaningPrice={settings.cleaningPrice}
            weights={settings.availableWeights}
          />
        </OrdersShell>
      </div>
    );
  }

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
    <div className="flex flex-col">
      <OrdersBrowser
        // `?tab=` wins when it names a real tab — he chose it. Otherwise open on
        // the first tab that has anything in it.
        initialTab={parseTab(params.tab) ?? defaultOrdersTab(counts)}
        counts={counts}
        panels={panels}
        header={header}
      />
    </div>
  );
}
