import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { formatArabicDate, formatArabicTime } from "@/lib/format";
import { ConfirmPriceButton } from "./ConfirmPriceButton";
import type { TrackedStage } from "./OrderTrackStrip";

/**
 * What the order-details screen says above the strip — the pill or pills, and on
 * a finished order the day it ended.
 *
 * **Two shapes, because the question changes.** While the order is running there
 * is one pill and, at the one stage where the customer still has something to do,
 * the button that does it. Once it is delivered the status has stopped being
 * news: it is over, and what he came to check is the money — so the pill splits
 * in two (the birds arrived, the money did or did not) and the date of the
 * handover goes under them, the same sentence his history card carries (C-51).
 */
export function OrderStatusHead({
  stage,
  orderId,
  deliveredAt,
  remaining,
  isHouse,
}: {
  stage: TrackedStage;
  orderId: string;
  /** When the birds were handed over — only read on a delivered order. */
  deliveredAt: string | null;
  /** Still owed, for the payment pill. */
  remaining: number;
  /** The family's own birds — never a sale, so never paid and never owed. */
  isHouse: boolean;
}) {
  if (stage !== "delivered") {
    return (
      /* RTL: the first child of a `justify-between` row lands on the RIGHT,
         which is where the design puts the pill — so the pill is written first
         and the button, on the left, second. With the button gone the row has
         one child and the pill stays where it was. */
      <div className="flex w-full items-center justify-between gap-3">
        <OrderStatusBadge stage={stage} viewer="customer" />

        {/* Only while the price is waiting on him. Once confirmed the button
            has done its job, and the design drops it (C-42, C-43). */}
        {stage === "weighed" && <ConfirmPriceButton orderId={orderId} />}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {/* `justify-start` — in RTL the start is the right edge, and the design
          packs both pills against it rather than spreading them. */}
      <div className="flex items-center justify-start gap-2">
        <OrderStatusBadge stage="delivered" viewer="customer" reads="handover" />
        <OrderStatusBadge
          stage="delivered"
          viewer="customer"
          remaining={remaining}
          isHouse={isHouse}
        />
      </div>

      {deliveredAt && <Handover at={deliveredAt} />}
    </div>
  );
}

/** «تم تسليم الطلب في ٥ نوفمبر الساعة ١٢:٣٠ م», centred under the two pills. */
function Handover({ at }: { at: string }) {
  const when = new Date(at);
  return (
    <p className="text-center text-sm text-foreground">
      تم تسليم الطلب في {formatArabicDate(when, "d MMMM")} الساعة{" "}
      {formatArabicTime(
        `${when.getHours()}:${String(when.getMinutes()).padStart(2, "0")}`,
      )}
    </p>
  );
}
