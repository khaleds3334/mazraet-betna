import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The status pill on an order card. Shared: the same order appears in the admin
 * list and in the customer's tracking, and the two read the same state under
 * different names (D-03) — `viewer` picks which wording to show.
 *
 * Once an order is delivered the status stops being the news — what is left to
 * say is whether it was paid for (FR-12), so pass `remaining` and the badge
 * reports that instead: settled in dark green, or the amount still owed in
 * orange. Every tone here now comes from a finished design except "cancelled",
 * which is confirmed when its card is drawn.
 */
const TONE: Record<OrderStatus, string> = {
  pending: "bg-warning-surface text-warning",
  weighed: "bg-info-surface text-info",
  ready: "bg-primary text-foreground",
  delivered: "bg-brand text-white",
  cancelled: "bg-error-soft text-white",
};

export function OrderStatusBadge({
  status,
  viewer = "admin",
  remaining,
  className,
}: {
  status: OrderStatus;
  viewer?: "admin" | "customer";
  /** Still owed. Only read on a delivered order, where it is the real state. */
  remaining?: number;
  className?: string;
}) {
  const owing = status === "delivered" && (remaining ?? 0) > 0;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1.5 text-sm whitespace-nowrap",
        owing ? "bg-accent-orange text-white" : TONE[status],
        className,
      )}
    >
      <span className="optical-center">
        {owing
          ? `متبقي مبلغ ${formatCurrency(remaining ?? 0)}`
          : status === "delivered"
            ? "تم الدفع"
            : ORDER_STATUS_LABEL[viewer][status]}
      </span>
    </span>
  );
}
