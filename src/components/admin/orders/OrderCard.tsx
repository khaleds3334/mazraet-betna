import { ContactLinks } from "@/components/shared/ContactLinks";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import type { OrderListItem } from "@/lib/queries/orders";
import {
  formatArabicDate,
  formatArabicTime,
  formatWeight,
  pluralizeChicken,
} from "@/lib/format";
import { EditCancelReasonButton } from "./EditCancelReasonButton";
import { OrderCardActions } from "./OrderCardActions";

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
 */
function pickupLabel(date: string | null, time: string | null): string {
  if (!date) return "مش محدد";
  const day = formatArabicDate(date, "EEEE d MMMM");
  return time ? `${day} — ${formatArabicTime(time)}` : day;
}

/**
 * An order in the admin's list (A-50). Rows read right-to-left: who and when on
 * top, the customer and how to reach them, the three figures of the order, and
 * the actions.
 *
 * A pure view — every value arrives formatted-ready on `order`.
 */
export function OrderCard({ order }: { order: OrderListItem }) {
  const placedAt = new Date(order.createdAt);

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
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1 text-right">
          <p className="text-base text-primary-foreground">
            {order.customer?.name ?? "طلب يتيم"}
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
              value={pickupLabel(order.pickupDate, order.pickupTime)}
            />
          </div>

          {/* Only the pending card's actions are designed (A-50). The other
              statuses get theirs as their cards are drawn. */}
          {order.status === "pending" && (
            <OrderCardActions orderId={order.id} />
          )}
        </>
      )}
    </article>
  );
}
