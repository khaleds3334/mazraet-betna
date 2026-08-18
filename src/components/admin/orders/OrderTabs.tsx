import Link from "next/link";
import { ADMIN_ORDER_TABS, type AdminOrderTabKey } from "@/lib/constants";
import type { OrderTabCounts } from "@/lib/queries/orders";
import { formatArabicNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The count bubble's fill per tab — the design gives each group its own colour so
 * the admin reads the row by shape, not by text: waiting = warm, running = blue,
 * done = solid green.
 */
const COUNT_TONE: Record<AdminOrderTabKey, string> = {
  new: "bg-warning-surface text-foreground",
  active: "bg-info-surface text-foreground",
  done: "bg-brand text-white",
};

/**
 * The tab bar on the orders screen (A-50): one chip per group of statuses
 * (FR-12) carrying how many orders sit in it. Tabs are plain links that set
 * `?tab=`, so the selection survives a refresh and the back button, and the
 * screen stays a server component with no client state (T-02).
 *
 * The row scrolls sideways rather than wrapping — the three chips are wider than
 * a 320px screen.
 */
export function OrderTabs({
  active,
  counts,
}: {
  active: AdminOrderTabKey;
  counts: OrderTabCounts;
}) {
  return (
    <nav
      aria-label="تصنيفات الطلبات"
      className="no-scrollbar flex items-center justify-between overflow-x-auto px-screen"
    >
      {ADMIN_ORDER_TABS.map((tab) => {
        const selected = tab.key === active;

        return (
          <Link
            key={tab.key}
            href={`/admin/orders?tab=${tab.key}`}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-primary-hover px-2 text-sm text-foreground",
              selected ? "bg-primary" : "bg-transparent",
            )}
          >
            <span className="optical-center whitespace-nowrap">
              {tab.label}
            </span>
            <span
              className={cn(
                "flex min-w-8 items-center justify-center rounded-full px-2 py-1.5",
                COUNT_TONE[tab.key],
              )}
            >
              <span className="optical-center">
                {formatArabicNumber(counts[tab.key])}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
