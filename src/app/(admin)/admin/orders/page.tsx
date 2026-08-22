import { redirect } from "next/navigation";
import { OrdersToolbar } from "@/components/admin/orders/OrdersToolbar";
import {
  OrdersBrowser,
  type OrderEntry,
} from "@/components/admin/orders/OrdersBrowser";
import { OrdersEmptyHeader } from "@/components/admin/orders/OrdersEmptyHeader";
import { OrderCard } from "@/components/admin/orders/card/OrderCard";
import {
  ADMIN_ORDER_TABS,
  DEFAULT_ADMIN_ORDER_TAB,
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
  EMPTY_ORDER_TAB_COUNTS,
  listCycleOrders,
  tallyOrderTabs,
  type OrderListItem,
} from "@/lib/queries/orders";

/**
 * One order, ready for the browser: the card rendered here on the server, and the
 * handful of fields its search box matches against.
 */
function toEntry(
  order: OrderListItem,
  settings: { salePrice: number; cleaningPrice: number; weights: number[] },
): OrderEntry {
  return {
    id: order.id,
    number: order.number,
    customer: order.customer,
    onBehalfOf: order.onBehalfOf,
    card: (
      <OrderCard
        order={order}
        salePrice={settings.salePrice}
        cleaningPrice={settings.cleaningPrice}
        weights={settings.weights}
      />
    ),
  };
}

/** An empty tab set — a farm with no cycle, and the archive's two unused tabs. */
const NO_ENTRIES: Record<AdminOrderTabKey, OrderEntry[]> = {
  new: [],
  active: [],
  done: [],
};

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

  // The screen for a farm that has no order history to show — no cycle at all, or
  // a first flock still being raised (see below). It draws the screen's own
  // chrome inert (`OrdersEmptyHeader`), so it reads as a screen waiting for its
  // first sale rather than one that failed to load.
  //
  // The search box and the tabs, though, are the working ones: a box over three
  // lists that are empty for three different reasons, and tapping one says which
  // — the only things left on this screen that can still answer (Khaled,
  // 2026-08-21). Same `OrdersBrowser` as the selling face, holding three empty
  // states instead of three lists, so they behave identically on both — URL
  // included — and there is exactly one search box on the screen, this one.
  const nothingYet = (
    <div className="flex flex-col">
      <OrdersBrowser
        initialTab={parseTab(params.tab) ?? DEFAULT_ADMIN_ORDER_TAB}
        counts={EMPTY_ORDER_TAB_COUNTS}
        panels={NO_ENTRIES}
        header={
          // The flock still being raised names itself; a farm with no cycle at
          // all has nothing to name.
          <OrdersEmptyHeader
            cycleName={cycle ? (cycle.name ?? "دورة بدون اسم") : null}
          />
        }
      />
    </div>
  );

  if (!cycle) return nothingYet;

  const orders = await listCycleOrders(farm.farmId, cycle);
  const counts = tallyOrderTabs(orders);

  // **The first flock, still being raised.** «الدورة الحالية» falls through to a
  // raising cycle only when the farm has neither a selling cycle nor an ended one
  // behind it (D-38, rule 3) — so there is no order anywhere on the farm, and no
  // other cycle the funnel could offer.
  //
  // The archive face below would then label that flock «المكتملة» and count its
  // orders, which says the cycle is over on the day it started (Khaled,
  // 2026-08-21). It is the same nothing as a farm with no cycle at all, so it
  // gets the same screen. The order count is still consulted rather than assumed:
  // if a row somehow sits on that cycle, showing it beats hiding it.
  const firstFlockRaising =
    cycle.phase === "raising" &&
    cycles.every((option) => !option.endedAt && !option.saleOpen);

  if (firstFlockRaising && orders.length === 0) return nothingYet;

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

  // The search box belongs to `OrdersBrowser` now — it owns the query and the
  // list it filters, and a box wired to neither would be decoration.
  const header = (
    <OrdersToolbar
      cycle={cycle}
      cycles={pickable}
      orderCount={orders.length}
      allDone={counts.done === orders.length}
      customers={customers}
      weights={settings.availableWeights}
      defaultCleaning={settings.defaultCleaning}
      salePrice={settings.salePrice}
      cleaningPrice={settings.cleaningPrice}
    />
  );

  const cardSettings = {
    salePrice: settings.salePrice,
    cleaningPrice: settings.cleaningPrice,
    weights: settings.availableWeights,
  };

  // An archive: one list, no tabs to choose between (D-41) — but the same search
  // box, because a finished cycle is exactly where he goes looking for one order.
  if (!cycle.saleOpen) {
    return (
      <div className="flex flex-col">
        <OrdersBrowser
          initialTab="done"
          counts={counts}
          panels={{
            ...NO_ENTRIES,
            done: orders.map((order) => toEntry(order, cardSettings)),
          }}
          header={header}
          showTabs={false}
        />
      </div>
    );
  }

  const panels = Object.fromEntries(
    ADMIN_ORDER_TABS.map((group) => [
      group.key,
      orders
        .filter((order) => group.statuses.includes(order.status))
        .map((order) => toEntry(order, cardSettings)),
    ]),
  ) as Record<AdminOrderTabKey, OrderEntry[]>;

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
