import { redirect } from "next/navigation";
import { SearchField } from "@/components/ui";
import { OrdersToolbar } from "@/components/admin/orders/OrdersToolbar";
import { OrderTabs } from "@/components/admin/orders/OrderTabs";
import { OrdersEmptyState } from "@/components/admin/orders/OrdersEmptyState";
import { OrderCard } from "@/components/admin/orders/OrderCard";
import {
  ADMIN_ORDER_TABS,
  DEFAULT_ADMIN_ORDER_TAB,
  type AdminOrderTabKey,
} from "@/lib/constants";
import { getCurrentFarm } from "@/lib/queries/admin";
import { listFarmCustomers } from "@/lib/queries/customers";
import { getDefaultOrdersCycle } from "@/lib/queries/cycles";
import { getFarmSettings } from "@/lib/queries/settings";
import {
  EMPTY_ORDER_TAB_COUNTS,
  getOrderTabCounts,
  listOrders,
} from "@/lib/queries/orders";

/** Keeps a hand-typed or stale `?tab=` from breaking the screen. */
function resolveTab(value: string | undefined): AdminOrderTabKey {
  const match = ADMIN_ORDER_TABS.find((tab) => tab.key === value);
  return match?.key ?? DEFAULT_ADMIN_ORDER_TAB;
}

/**
 * Admin orders list (A-50). The orders of one cycle — the running one, or the
 * last one to end — split across the three tabs of FR-12, each showing its count.
 *
 * This pass builds the screen's frame, its empty states, and the add-order sheet
 * (A-56); the order cards and the cycle picker behind the funnel come next.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const farm = await getCurrentFarm();
  if (!farm) redirect("/login");

  const [{ tab }, cycle, customers, settings] = await Promise.all([
    searchParams,
    getDefaultOrdersCycle(farm.farmId),
    listFarmCustomers(farm.farmId),
    getFarmSettings(farm.farmId),
  ]);
  const activeTab = resolveTab(tab);

  // A farm with no cycle yet has no orders either — the same empty state, with
  // every count at zero.
  const counts = cycle
    ? await getOrderTabCounts(farm.farmId, cycle.cycleId)
    : EMPTY_ORDER_TAB_COUNTS;

  const statuses =
    ADMIN_ORDER_TABS.find((tab) => tab.key === activeTab)?.statuses ?? [];
  const orders =
    cycle && counts[activeTab] > 0
      ? await listOrders(farm.farmId, cycle, statuses)
      : [];

  return (
    // `min-h-0` all the way down is what keeps the toolbar, the search box and
    // the tabs pinned: without it the flex children refuse to shrink, the column
    // grows past the viewport, and the whole page scrolls instead of the list.
    <div className="flex min-h-0 flex-1 flex-col gap-4 pt-4">
      <OrdersToolbar
        customers={customers}
        weights={settings.availableWeights}
        defaultCleaning={settings.defaultCleaning}
      />
      <div className="px-screen">
        {/* Static until the list it would filter is wired — see SearchField. */}
        <SearchField placeholder="ابحث باسم العميل او رقم الطلب" />
      </div>
      <OrderTabs active={activeTab} counts={counts} />

      {/* Only this region scrolls. Its padding is here, not on the list, so the
          scrollbar rides the screen edge. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-screen pb-2">
        {orders.length === 0 ? (
          <OrdersEmptyState tab={activeTab} />
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
