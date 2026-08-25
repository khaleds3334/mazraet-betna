"use client";

import { useState } from "react";
import { Chip } from "@/components/ui";
import { computeInvoice } from "@/lib/calculations/invoice";
import type { OrderListItem } from "@/lib/queries/orders";
import { HistoryCard } from "./HistoryCard";
import { HistoryHeading } from "./HistoryHeading";

/**
 * «طلباتك السابقة» — the list and the three filters above it (C-51/C-52).
 *
 * ## The filters
 *
 * Three chips, and **nothing selected is the fourth state**: the screen opens on
 * everything, and tapping the lit chip puts it back. The design draws no "الكل",
 * and inventing one would be a fourth thing to read on a screen whose whole job
 * is to be scanned — the way out of a filter is the chip that got you into it.
 *
 * One at a time. They are not overlapping questions: an order is settled, or it
 * is owed on, or it never happened.
 *
 * **Filtering happens here, not in the query.** A customer's finished orders are
 * a handful, they are already on the page, and a round trip to the server per
 * chip would put a spinner between him and a list he is looking at.
 *
 * Centred, not pushed to the reading edge — the design sets them under a centred
 * title and a centred caption, and a row of three that starts at the right hangs
 * off the column those two establish.
 *
 * ## Order
 *
 * RTL puts the first chip on the right, which is where the design starts:
 * مدفوع · عليه فلوس · ملغي.
 *
 * ## What scrolls
 *
 * **Only the cards.** The title, the caption and the chips are pinned (Khaled,
 * 2026-08-25): the chips are how you steer this screen, and a control that
 * scrolls away is one you have to scroll back for to change your mind.
 *
 * `sticky` and not `fixed` — the scroller is `<main>`, and a fixed block would
 * be positioned against the viewport instead, landing over the shell's own
 * chrome. It carries `bg-background` because cards pass underneath it, and
 * z-20 to stay over them, which is the tier the customer's home header sits on.
 *
 * The heading is inside this component rather than left on the page so that all
 * three pinned things are one block with one background. The empty state (C-50)
 * draws the same heading from `HistoryHeading`, unpinned, because it has nothing
 * to scroll.
 */
type Filter = "paid" | "owing" | "cancelled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "paid", label: "مدفوع" },
  // «عليه فلوس», not «علية» — the spelling fix from the naming sheet.
  { key: "owing", label: "عليه فلوس" },
  { key: "cancelled", label: "ملغي" },
];

/** Which of the three an order is. Cancelled first: it has no money to read. */
function categorise(order: OrderListItem): Filter {
  if (order.status === "cancelled") return "cancelled";

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

  // The family's own birds are never a sale (FR-36) — nothing is owed on them,
  // so they belong with the settled rather than in a debt filter.
  const owed = !order.isHouse && invoice.remaining > 0;
  return owed ? "owing" : "paid";
}

export function HistoryList({ orders }: { orders: OrderListItem[] }) {
  const [filter, setFilter] = useState<Filter | null>(null);

  const shown =
    filter === null
      ? orders
      : orders.filter((order) => categorise(order) === filter);

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-20 bg-background pb-1">
        <HistoryHeading />

        {/* Centred, and still a sideways scroller: the three fit at 320px with
            room to spare, but a longer word in a future filter must push the row
            rather than the screen. */}
        <div className="no-scrollbar flex justify-center gap-2.5 overflow-x-auto px-screen py-4">
          {FILTERS.map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              selected={filter === key}
              onClick={() => setFilter(filter === key ? null : key)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-screen pb-3">
        {shown.length === 0 ? (
          // Not `EmptyOrders` — he *has* orders, just none of this kind, and the
          // crate with «اطلب دلوقتي» under it would be answering a question he
          // did not ask. One line, and the chip that caused it is right above.
          <p className="py-10 text-center text-base text-muted">
            مفيش طلبات في القسم ده
          </p>
        ) : (
          shown.map((order) => <HistoryCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}
