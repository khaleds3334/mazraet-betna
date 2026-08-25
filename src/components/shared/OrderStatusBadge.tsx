import { ORDER_STATUS_LABEL, type OrderStage } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The status pill on an order card. Shared: the same order appears in the admin
 * list and in the customer's tracking, and the two read the same state under
 * different names (D-03) — `viewer` picks which wording to show.
 *
 * It takes a **stage**, not a status: one of the five things an order can be
 * doing, which is one more than the database's four. «يتم الذبح و التنظيف» is
 * the customer's own step and has no status behind it — see `orderStage`.
 *
 * Once an order is delivered the status stops being the news — what is left to
 * say is whether it was paid for (FR-12), so pass `remaining` and the badge
 * reports that instead: settled in dark green, or the amount still owed in
 * orange.
 *
 * **Unless the screen has room to say both.** The history card (C-51) stacks two
 * pills: the birds arrived, and then the money did or did not. `reads="handover"`
 * is the first of those — the plain fact of delivery, in the soft green the
 * design gives it. Everywhere else there is one pill and money is the question
 * worth its space, which is why that is the default.
 *
 * A house order answers that question with «مش محسوب». The family's own birds
 * are not a sale (FR-36), so «تم الدفع» would be claiming money changed hands
 * and «متبقي مبلغ» would be a debt owed to nobody — which is what the card said
 * before (Khaled, 2026-08-22). It wears the settled badge, because that is what
 * "nothing outstanding here" looks like everywhere else on this screen.
 */
const TONE: Record<OrderStage, string> = {
  pending: "bg-warning-surface text-warning",
  weighed: "bg-info-surface text-info",
  // Grey, and the only quiet pill on the screen: nobody is being asked for
  // anything here. The order has left the customer's hands and has not yet
  // arrived at the admin's next step — the farm is simply working.
  cleaning: "bg-control-border text-foreground",
  ready: "bg-primary text-foreground",
  delivered: "bg-brand text-white",
  cancelled: "bg-error-soft text-white",
};

export function OrderStatusBadge({
  stage,
  viewer = "admin",
  reads = "payment",
  remaining,
  isHouse = false,
  className,
}: {
  /** Where the order is now — `orderStage(order)`, not `order.status`. */
  stage: OrderStage;
  viewer?: "admin" | "customer";
  /**
   * What a **delivered** order's pill reports. Ignored at every other stage.
   * `"payment"` — whether the money arrived. `"handover"` — that the birds did.
   */
  reads?: "payment" | "handover";
  /** Still owed. Only read on a delivered order, where it is the real state. */
  remaining?: number;
  /** The family's own birds — never a sale, so never paid and never owed. */
  isHouse?: boolean;
  className?: string;
}) {
  const money = stage === "delivered" && reads === "payment";
  const owing = money && !isHouse && (remaining ?? 0) > 0;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1.5 text-sm whitespace-nowrap",
        owing
          ? "bg-accent-orange text-white"
          : stage === "delivered" && !money
            ? "bg-success-surface text-success"
            : TONE[stage],
        className,
      )}
    >
      <span className="optical-center">
        {owing
          ? `متبقي مبلغ ${formatCurrency(remaining ?? 0)}`
          : money
            ? isHouse
              ? "مش محسوب"
              : "تم الدفع"
            : ORDER_STATUS_LABEL[viewer][stage]}
      </span>
    </span>
  );
}
