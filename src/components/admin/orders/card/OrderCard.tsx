import { Badge } from "@/components/ui";
import { ContactLinks } from "@/components/shared/ContactLinks";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import type { OrderListItem } from "@/lib/queries/orders";
import {
  formatArabicDate,
  formatArabicTime,
  formatWeight,
  pluralizeChicken,
} from "@/lib/format";
import { computeInvoice } from "@/lib/calculations/invoice";
import { orderStage, PICKUP_UNSET } from "@/lib/constants";
import { EditCancelReasonButton } from "./EditCancelReasonButton";
import { InvoiceTotal } from "./InvoiceTotal";
import { OrderCardActions } from "./OrderCardActions";
import { DeliveredOrderActions } from "./DeliveredOrderActions";
import { OrderStageActions } from "./OrderStageActions";

/** One labelled figure in the card's middle row. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 text-center">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

/**
 * When the customer is coming to collect. Orders the admin books himself carry no
 * pickup slot — A-56 doesn't ask for one — so they read "مش محدد" (Khaled,
 * 2026-08-18) rather than an empty gap.
 *
 * The slot shows the words the customer actually picked («بعد صلاة العصر»), not
 * the clock value behind them, so both sides of the farm say the same thing about
 * the same appointment (migration 027). The query resolves the name; an order
 * older than the slots falls back to its clock there.
 */
function pickupLabel(date: string | null, slot: string | null): string {
  if (!date) return PICKUP_UNSET;
  const day = formatArabicDate(date, "EEEE d MMMM");
  return slot ? `${day} — ${slot}` : day;
}

/**
 * An order in the admin's list (A-50). Rows read right-to-left: who and when on
 * top, the customer and how to reach them, the three figures of the order, and
 * the actions.
 *
 * A pure view — every value arrives formatted-ready on `order`.
 */
export function OrderCard({
  order,
  salePrice,
  cleaningPrice,
  weights,
}: {
  order: OrderListItem;
  /** Live settings, handed to the weighing sheet this card opens (T-15). */
  salePrice: number;
  cleaningPrice: number;
  /** The weights an order may be asked at — the split dialog picks from these. */
  weights: number[];
}) {
  const placedAt = new Date(order.createdAt);
  // Once an order is weighed the card stops showing what was asked for and shows
  // what it came to — the invoice is the order itself (D-05).
  const weighed = order.status !== "pending" && order.status !== "cancelled";
  const unitPrice = order.weighing.unitPrice ?? 0;
  const cleaningFee = order.weighing.cleaningPrice ?? 0;
  const invoice = computeInvoice(
    { unit_price: unitPrice, cleaning_price: cleaningFee },
    order.weighing.lines.map((line) => ({
      id: line.id,
      // The bag the bird is actually in — hardcoding 1 here collapsed a split
      // order back into one bag on its way to the invoice (FR-14ب).
      batch_no: line.batchNo,
      position: line.position,
      actual_weight: line.actualWeight,
      cleaning: line.cleaning,
    })),
    order.payments,
  );
  const amountDue = Math.max(0, invoice.remaining);

  return (
    <article className="flex flex-col gap-[13px] rounded-xl border-2 border-border p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 text-right">
          <p className="text-sm text-accent-tan">طلب رقم {order.number}#</p>
          <p className="text-xs text-disabled-soft">
            في {formatArabicDate(placedAt)} الساعة{" "}
            {formatArabicTime(
              `${placedAt.getHours()}:${String(placedAt.getMinutes()).padStart(2, "0")}`,
            )}
          </p>
        </div>
        {/* The pill is the only thing on the admin's card that knows the
            customer has confirmed the price — «تم تأكيد السعر». Everything
            below stays put: the order is still «weighed» to him, and «جاهز
            للاستلام» is still the next thing he presses. */}
        <OrderStatusBadge
          stage={orderStage(order)}
          remaining={amountDue}
          isHouse={order.isHouse}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1 text-right">
          <p className="text-base text-primary-foreground">
            {order.isHouse
              ? "فراخ البيت"
              : (order.customer?.name ?? "طلب يتيم")}
            {/* Whoever the birds are really for, right beside the name that
                carries the money — the admin reads the pair as one line. */}
            {order.onBehalfOf && (
              <span className="text-sm text-muted"> [{order.onBehalfOf}]</span>
            )}
          </p>
          {order.customer && (
            <p className="text-sm text-foreground">{order.customer.phone}</p>
          )}
        </div>
        {order.customer && <ContactLinks phone={order.customer.phone} />}
        {/* A house order has nobody to call, so the badge takes the space the
            contact buttons would have filled rather than crowding the status. */}
        {order.isHouse && (
          <Badge tone="accent" size="sm">
            للبيت
          </Badge>
        )}
      </div>

      {/* A cancelled order drops the figures and the actions: what matters about
          it now is why it never happened. */}
      {order.status === "cancelled" ? (
        <div className="flex items-center justify-center gap-1.5">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-h5 font-bold text-error">سبب الغاء الطلب</p>
            <p className="text-sm text-muted">
              {order.cancelReason ?? "مفيش سبب مكتوب"}
            </p>
          </div>
          <EditCancelReasonButton
            orderId={order.id}
            reason={order.cancelReason}
          />
        </div>
      ) : (
        <>
          {weighed ? (
            <InvoiceTotal invoice={invoice} unitPrice={unitPrice} />
          ) : (
            <div className="flex items-start justify-between gap-2">
              <Stat
                label="العدد المطلوب"
                value={pluralizeChicken(order.chickenCount)}
              />
              <Stat
                label="الوزن المطلوب"
                value={
                  order.approxWeight == null
                    ? "أوزان مختلفة"
                    : formatWeight(order.approxWeight)
                }
              />
              <Stat
                label="ميعاد تجهيز الفراخ"
                value={pickupLabel(order.pickupDate, order.pickupTimeLabel)}
              />
            </div>
          )}

          {/* Every live status is drawn now (A-50); only a cancelled card takes
              the other branch above, and it has no actions by design. */}
          {order.status === "pending" && (
            <OrderCardActions
              order={order}
              salePrice={salePrice}
              cleaningPrice={cleaningPrice}
              weights={weights}
            />
          )}
          {(order.status === "weighed" || order.status === "ready") && (
            <OrderStageActions
              order={order}
              stage={order.status}
              invoice={invoice}
              unitPrice={unitPrice}
              cleaningPrice={cleaningFee}
            />
          )}
          {order.status === "delivered" && (
            <DeliveredOrderActions
              order={order}
              invoice={invoice}
              unitPrice={unitPrice}
              cleaningPrice={cleaningFee}
            />
          )}
        </>
      )}
    </article>
  );
}
