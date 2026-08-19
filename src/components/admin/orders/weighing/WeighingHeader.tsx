"use client";

import { Toggle } from "@/components/ui";
import type { OrderListItem } from "@/lib/queries/orders";
import { formatArabicNumber, pluralizeChicken } from "@/lib/format";
import { KnifeGlyph } from "./glyphs";

/** Who the birds are for — the customer, the relative, or nobody yet (FR-13). */
function orderFor(order: OrderListItem): string {
  if (order.isHouse) return "طلب البيت";
  return order.onBehalfOf ?? order.customer?.name ?? "طلب يتيم";
}

/**
 * The band above the weight rows on A-52: who the order is for, how many birds
 * and at what price, the cleaning switch, and the customer's own note.
 *
 * The note is why this band exists at all — "خلي الكبد في كيسة لوحدهم" is the
 * kind of thing the admin has to see while the bird is on the scale, not after.
 */
export function WeighingHeader({
  order,
  unitPrice,
  chickenCount,
  cleaning,
  onCleaningChange,
}: {
  order: OrderListItem;
  unitPrice: number;
  /** Counted from the rows, so removing a bird updates it live (FR-14ج). */
  chickenCount: number;
  cleaning: boolean;
  onCleaningChange: (cleaning: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Three parts, with the two outer ones sharing the leftover width evenly
          (`flex-1 basis-0`) — that is what puts the count and the price on the
          exact centre of the row, wherever the name ends. */}
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 basis-0 truncate text-base text-primary-foreground">
          {orderFor(order)}
        </span>

        <div className="flex shrink-0 items-center gap-4 text-sm text-foreground">
          <span>{pluralizeChicken(chickenCount)}</span>
          <span>{formatArabicNumber(unitPrice)} ج/كجم</span>
        </div>

        <div className="flex flex-1 basis-0 items-center justify-end gap-1">
          {/* Mirrored: the blade points left, the way the row reads. */}
          <span className="-scale-x-100 text-accent-tan">
            <KnifeGlyph size={24} />
          </span>
          <Toggle
            checked={cleaning}
            onChange={onCleaningChange}
            label="التنظيف"
          />
        </div>
      </div>

      {order.weighing.notes && (
        <p className="rounded-[10px] border border-accent-tan bg-surface-warm px-4 py-2.5 text-center text-sm text-primary-foreground">
          {order.weighing.notes}
        </p>
      )}
    </div>
  );
}
