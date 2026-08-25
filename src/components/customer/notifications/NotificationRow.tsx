import Link from "next/link";
import { StatusBubble } from "@/components/ui";
import { formatTimeAgo } from "@/lib/format";
import type { CustomerNotification } from "@/lib/queries/notifications";
import { cn } from "@/lib/utils";

/**
 * One notice on «الرسائل و الاشعارات» (C-15): the tone bubble on the reading
 * edge, the headline and its sentence beside it, and how long ago underneath.
 *
 * **The order number is put on here, not stored.** The sentence in the database
 * is written to read after «طلبك رقم ١٢٢٤#» and nothing else — every number this
 * app shows a human goes through `/lib/format.ts` (rule 3), and a body carrying
 * its own digits would have meant a second implementation of that in SQL. See
 * migration 029.
 *
 * **A notice about an order opens it** (Khaled, 2026-08-25). It is the thing the
 * customer would reach for next, and by the time he is reading «الفاتورة جاهزة»
 * the only useful reply is to go and look at it. The two that are about no order
 * — the welcome and the sale opening — are not links, and do not pretend to be.
 *
 * Read ones sit at half strength, which is the design's whole distinction
 * between «الجديدة» and «القديمة» beyond the headings.
 */
export function NotificationRow({
  notification,
}: {
  notification: CustomerNotification;
}) {
  const { orderId, orderNumber, body, isRead } = notification;

  const line = (
    <>
      {orderNumber && <>طلب رقم {orderNumber}# </>}
      {body}
    </>
  );

  const content = (
    <>
      {/* RTL: the first child lands on the RIGHT, which is where the design
          hangs the bubble — the mark comes before the words it marks. */}
      <div className="flex w-full items-center gap-2.5">
        <StatusBubble tone={notification.kind} />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-right">
          <p className="text-base text-heading">{notification.title}</p>
          {body && <p className="text-sm text-muted">{line}</p>}
        </div>
      </div>

      {/* On the far side from the reading edge, under the text rather than under
          the bubble: it is the least of the three things on this row, and the
          design parks it where the eye finishes rather than where it starts. */}
      <p className="w-full text-left text-xs text-timestamp">
        {formatTimeAgo(notification.createdAt)}
      </p>
    </>
  );

  const shape = cn(
    "flex flex-col items-end justify-center gap-1.5 border-b-2 border-border py-2",
    isRead && "opacity-50",
  );

  return orderId ? (
    <Link href={`/tracking/${orderId}`} replace className={shape}>
      {content}
    </Link>
  ) : (
    <div className={shape}>{content}</div>
  );
}
