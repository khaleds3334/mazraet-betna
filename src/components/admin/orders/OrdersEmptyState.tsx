import { EmptyState } from "@/components/ui";
import type { AdminOrderTabKey } from "@/lib/constants";
import type { IconName } from "@/lib/icons";

/**
 * What the selected tab shows when it holds no orders (A-50). Each tab gets its
 * own glyph and sentence — "مفيش طلبات" alone wouldn't tell the admin which of
 * the three lists he is looking at.
 */
const EMPTY: Record<AdminOrderTabKey, { icon: IconName; title: string }> = {
  new: { icon: "ordersWaiting", title: "لا يوجد طلبات جديدة" },
  active: { icon: "ordersProcessing", title: "لا يوجد طلبات قيد التشغيل" },
  done: { icon: "delivered", title: "لا يوجد طلبات مكتملة" },
};

export function OrdersEmptyState({ tab }: { tab: AdminOrderTabKey }) {
  const { icon, title } = EMPTY[tab];

  // Sits a fixed distance under the tabs rather than centred in what's left:
  // that is where the design puts it, and it stays put on any screen height.
  return <EmptyState icon={icon} title={title} className="pt-21" />;
}
