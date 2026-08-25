import {
  OrderCardRows,
  OrderCardShell,
} from "@/components/customer/OrderCardShell";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { computeInvoice } from "@/lib/calculations/invoice";
import {
  formatArabicDate,
  formatArabicTime,
  formatCurrency,
  pluralizeChicken,
} from "@/lib/format";
import type { OrderListItem } from "@/lib/queries/orders";

/**
 * A finished order on «طلباتك السابقة» (C-51/C-52). Tapping it opens that
 * order's details — C-45 or C-46 depending on whether it was paid for.
 *
 * Three readings, and the first two differ by one line:
 *
 * - **delivered and settled** — how many birds, what they came to. Nothing else
 *   is owed, so nothing else is said.
 * - **delivered with money still on it** — the same two, plus what has been paid
 *   so far. The remainder is on the pill, in orange, where the eye goes first.
 * - **cancelled** — no figures at all. An order that never happened has no count
 *   worth reporting and no price; what it has is a reason, and that is the whole
 *   middle of the card.
 *
 * **Two pills, not one** (C-51). On the tracking screen the status *is* the
 * news; here it is settled — every card says «تم الاستلام» — and the thing the
 * customer opened this screen for is the second pill: paid, or how much is
 * left (FR-12, FR-30). A cancelled order wears one, because there is no second
 * question to answer about it.
 *
 * The closing line dates the ending rather than the order: «تم تسليم الطلب في …»
 * off `deliveredAt`, «تم الغاء الطلب في …» off `cancelledAt`. The card's header
 * already carries the day it was placed, and repeating it below would be the
 * same date twice.
 *
 * **A cancelled card opens nothing** (Khaled, 2026-08-25), so it has no arrow
 * either — see `OrderCardShell`. There is no detail screen behind it: C-45 and
 * C-46 are an invoice and a payment history, and an order that was called off
 * has neither. Everything it has to say is the reason, which is already the
 * whole middle of the card. Its date runs on one line, the room the arrow left.
 */
export function HistoryCard({ order }: { order: OrderListItem }) {
  const invoice = computeInvoice(
    {
      unit_price: order.weighing.unitPrice ?? 0,
      cleaning_price: order.weighing.cleaningPrice ?? 0,
    },
    order.weighing.lines.map((line) => ({
      id: line.id,
      batch_no: line.batchNo,
      position: line.position,
      actual_weight: line.actualWeight,
      cleaning: line.cleaning,
    })),
    order.payments,
  );

  const cancelled = order.status === "cancelled";
  const owing = !cancelled && !order.isHouse && invoice.remaining > 0;

  return (
    <OrderCardShell
      href={cancelled ? undefined : `/tracking/${order.id}`}
      number={order.number}
      placedAt={order.createdAt}
      hintCentred
      badges={
        cancelled ? (
          <OrderStatusBadge stage="cancelled" viewer="customer" />
        ) : (
          <>
            <OrderStatusBadge
              stage="delivered"
              viewer="customer"
              reads="handover"
            />
            <OrderStatusBadge
              stage="delivered"
              viewer="customer"
              remaining={invoice.remaining}
              isHouse={order.isHouse}
            />
          </>
        )
      }
      hint={<Ending order={order} cancelled={cancelled} />}
    >
      {cancelled ? (
        <CancelReason reason={order.cancelReason} />
      ) : (
        <OrderCardRows
          rows={[
            {
              label: "عدد الفراخ المطلوبة",
              value: pluralizeChicken(order.chickenCount),
              strong: true,
            },
            {
              label: "السعر النهائي",
              value: formatCurrency(invoice.total),
              strong: true,
            },
            // Only while it means something. On a settled order «المبلغ المدفوع»
            // is the price again, said twice — the pill above has already
            // answered the only question left (Khaled, 2026-08-25, same rule as
            // the invoice on C-41).
            ...(owing
              ? [
                  {
                    label: "المبلغ المدفوع",
                    value: formatCurrency(invoice.paid),
                    strong: true,
                  },
                ]
              : []),
          ]}
        />
      )}
    </OrderCardShell>
  );
}

/** Why the admin called it off (A-51) — required there, so always here. */
function CancelReason({ reason }: { reason: string | null }) {
  return (
    <div className="flex flex-col items-center gap-[5px] px-card text-center">
      <p className="text-h5 font-bold text-error">سبب الغاء الطلب</p>
      <p className="text-sm text-muted">{reason || "من غير سبب مكتوب"}</p>
    </div>
  );
}

/**
 * «تم تسليم الطلب في ٥ نوفمبر الساعة ١٢:٣٠ م» — the date the order ended.
 *
 * A delivered card breaks it over two lines, as the design draws it, and does so
 * with two elements rather than one string and a `<br />`: an Arabic sentence
 * split by a raw break loses its direction at the seam, a bug this project has
 * already paid for once (C-30).
 *
 * A cancelled card keeps it on one line (Khaled, 2026-08-25) — with no arrow
 * beside it there is a whole card's width to say it in, and wrapping a line that
 * fits reads as a line that was too long.
 */
function Ending({
  order,
  cancelled,
}: {
  order: OrderListItem;
  cancelled: boolean;
}) {
  const at = cancelled ? order.cancelledAt : order.deliveredAt;
  if (!at) return <>{cancelled ? "تم الغاء الطلب" : "تم تسليم الطلب"}</>;

  const when = new Date(at);
  const date = `${formatArabicDate(when, "d MMMM")} الساعة ${formatArabicTime(
    `${when.getHours()}:${String(when.getMinutes()).padStart(2, "0")}`,
  )}`;

  if (cancelled) return <>تم الغاء الطلب في {date}</>;

  return (
    <>
      <span className="block">تم تسليم الطلب في</span>
      <span className="block">{date}</span>
    </>
  );
}
