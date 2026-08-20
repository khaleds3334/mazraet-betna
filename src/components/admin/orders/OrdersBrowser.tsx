"use client";

import type { ReactNode } from "react";
import { resolveTab, type AdminOrderTabKey } from "@/lib/constants";
import type { OrderTabCounts } from "@/lib/queries/orders";
import { useUrlParam } from "@/hooks/useUrlParam";
import { OrdersShell } from "./OrdersShell";
import { OrderTabs } from "./OrderTabs";

const writeTab = (tab: AdminOrderTabKey) => tab;

/**
 * The tab bar and whatever sits under it (A-50).
 *
 * Switching tabs does not touch the server. The page hands over all three tabs
 * already rendered — they are three views of one list the server read once — so
 * this only chooses which to show. That is the whole point: a tab used to cost a
 * full trip through auth → farm → cycle → count → list, seconds of a frozen
 * screen while the admin waited for a filter (D-31).
 *
 * The URL still carries the tab, pushed with the browser's own history API
 * rather than the router, because the router would fetch the page again and hand
 * back the seconds we just saved. Refresh, back and a shared link all still land
 * where they should.
 */
export function OrdersBrowser({
  initialTab,
  counts,
  panels,
  header,
}: {
  initialTab: AdminOrderTabKey;
  counts: OrderTabCounts;
  /** Each tab's list, rendered on the server — the cards ship no JavaScript. */
  panels: Record<AdminOrderTabKey, ReactNode>;
  /** Whatever is pinned above the tabs: the add button, the funnel, the search. */
  header: ReactNode;
}) {
  const [active, select] = useUrlParam("tab", initialTab, resolveTab, writeTab);

  return (
    <OrdersShell
      header={
        <>
          {/* The tabs are pinned with the toolbar above them, not with the list
              they control — the list is what moves underneath (T-35). */}
          {header}
          <OrderTabs active={active} counts={counts} onSelect={select} />
        </>
      }
    >
      {panels[active]}
    </OrdersShell>
  );
}
