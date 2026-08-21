"use client";

import { useState, type ReactNode } from "react";
import { EmptyState, SearchField } from "@/components/ui";
import { resolveTab, type AdminOrderTabKey } from "@/lib/constants";
import type { OrderTabCounts } from "@/lib/queries/orders";
import { matchesOrder } from "@/lib/search";
import { useUrlParam } from "@/hooks/useUrlParam";
import { OrdersShell } from "./OrdersShell";
import { OrderTabs } from "./OrderTabs";
import { OrdersEmptyState } from "./OrdersEmptyState";

const writeTab = (tab: AdminOrderTabKey) => tab;

/**
 * One order in a tab: the card, already rendered on the server, plus the few
 * fields the search box needs to decide whether to show it.
 *
 * The card travels as a **node**, not as data to be rendered here. It is built on
 * the server and stays built; searching only chooses which of the finished cards
 * to put on the page. That is what keeps a screenful of order cards off the
 * client's rendering path while still filtering instantly.
 */
export interface OrderEntry {
  id: string;
  number: string;
  customer: { name: string; phone: string } | null;
  onBehalfOf: string | null;
  card: ReactNode;
}

/**
 * The search box, the tab bar, and the list under them (A-50).
 *
 * Switching tabs does not touch the server. The page hands over all three tabs
 * already rendered — they are three views of one list the server read once — so
 * this only chooses which to show. That is the whole point: a tab used to cost a
 * full trip through auth → farm → cycle → count → list, seconds of a frozen
 * screen while the admin waited for a filter (D-31).
 *
 * **Searching costs nothing either**, for the same reason: the query filters
 * cards the browser is already holding. It matches a name the way the customers
 * screen does — articles dropped, spelling forgiven — and a number against the
 * order number as well as the phone (`matchesOrder`).
 *
 * The URL still carries the tab, pushed with the browser's own history API rather
 * than the router, because the router would fetch the page again and hand back
 * the seconds we just saved. Refresh, back and a shared link all still land where
 * they should. The query deliberately stays out of the URL: it is a glance at the
 * list, not a place to come back to.
 *
 * `showTabs` is false on a finished cycle, where every order is completed and the
 * three tabs collapse into the one the toolbar already names (D-41).
 */
export function OrdersBrowser({
  initialTab,
  counts,
  panels,
  header,
  showTabs = true,
}: {
  initialTab: AdminOrderTabKey;
  counts: OrderTabCounts;
  /** Each tab's orders, their cards rendered on the server. */
  panels: Record<AdminOrderTabKey, OrderEntry[]>;
  /** Whatever is pinned above the search box: the add button and the funnel. */
  header: ReactNode;
  showTabs?: boolean;
}) {
  const [active, select] = useUrlParam("tab", initialTab, resolveTab, writeTab);
  const [query, setQuery] = useState("");

  const entries = panels[active];
  const found = query.trim()
    ? entries.filter((entry) => matchesOrder(entry, query))
    : entries;

  return (
    <OrdersShell
      header={
        <>
          {/* The tabs are pinned with the toolbar above them, not with the list
              they control — the list is what moves underneath (T-35). */}
          {header}
          <div className="px-screen">
            <SearchField
              placeholder="ابحث باسم العميل او رقم الطلب"
              value={query}
              onChange={setQuery}
            />
          </div>
          {showTabs && (
            <OrderTabs active={active} counts={counts} onSelect={select} />
          )}
        </>
      }
    >
      {entries.length === 0 ? (
        <OrdersEmptyState tab={active} />
      ) : found.length === 0 ? (
        // Not the same nothing: the tab has orders, this search doesn't reach
        // them. Saying «لا يوجد طلبات» here would read as if they were gone.
        <EmptyState icon="search" title="مفيش طلب بالبحث ده" className="pt-21" />
      ) : (
        <ul className="flex flex-col gap-3">
          {found.map((entry) => (
            <li key={entry.id}>{entry.card}</li>
          ))}
        </ul>
      )}
    </OrdersShell>
  );
}
