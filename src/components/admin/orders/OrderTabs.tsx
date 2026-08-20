"use client";

import { ADMIN_ORDER_TABS, type AdminOrderTabKey } from "@/lib/constants";
import type { OrderTabCounts } from "@/lib/queries/orders";
import { OrderTabChip } from "./OrderTabChip";

/**
 * The tab bar on the orders screen (A-50): one chip per group of statuses
 * (FR-12) carrying how many orders sit in it. Buttons rather than links — the
 * lists are already on the page, so `OrdersBrowser` swaps them without a server
 * round trip and keeps `?tab=` in the URL itself (D-31).
 *
 * The row scrolls sideways rather than wrapping — the three chips are wider than
 * a 320px screen.
 */
export function OrderTabs({
  active,
  counts,
  onSelect,
}: {
  active: AdminOrderTabKey;
  counts: OrderTabCounts;
  onSelect: (tab: AdminOrderTabKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="تصنيفات الطلبات"
      className="no-scrollbar flex items-center justify-between overflow-x-auto px-screen"
    >
      {ADMIN_ORDER_TABS.map((tab) => (
        <OrderTabChip
          key={tab.key}
          tab={tab.key}
          label={tab.label}
          count={counts[tab.key]}
          selected={tab.key === active}
          onSelect={() => onSelect(tab.key)}
        />
      ))}
    </div>
  );
}
