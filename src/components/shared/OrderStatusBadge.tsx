import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The status pill on an order card. Shared: the same order appears in the admin
 * list and in the customer's tracking, and the two read the same state under
 * different names (D-03) — `viewer` picks which wording to show.
 *
 * The pending, weighed and ready tones are taken from finished designs (A-50);
 * the other two follow the palette's own meaning and get confirmed as their
 * cards are drawn.
 */
const TONE: Record<OrderStatus, string> = {
  pending: "bg-warning-surface text-warning",
  weighed: "bg-info-surface text-info",
  ready: "bg-primary text-foreground",
  delivered: "bg-success-surface text-success",
  cancelled: "bg-error-soft text-white",
};

export function OrderStatusBadge({
  status,
  viewer = "admin",
  className,
}: {
  status: OrderStatus;
  viewer?: "admin" | "customer";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1.5 text-sm whitespace-nowrap",
        TONE[status],
        className,
      )}
    >
      <span className="optical-center">
        {ORDER_STATUS_LABEL[viewer][status]}
      </span>
    </span>
  );
}
