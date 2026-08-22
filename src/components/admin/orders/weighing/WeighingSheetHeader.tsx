"use client";

import { Checkbox, CloseButton } from "@/components/ui";
import type { OrderListItem } from "@/lib/queries/orders";
import { WeighingHeader } from "./WeighingHeader";

/**
 * Everything pinned above the weight rows (A-52): the title and the way out,
 * who the order is for, and the instruction with the split beside it.
 *
 * «تقسيم الطلب» is a checkbox rather than a button because it reports a state as
 * much as it starts one — ticking opens the dialog that deals the birds into
 * bags (FR-14ب), and unticking puts them all back in one.
 */
export function WeighingSheetHeader({
  order,
  unitPrice,
  priceChanged,
  chickenCount,
  cleaning,
  onCleaningChange,
  isSplit,
  onSplit,
  onUnsplit,
  onClose,
}: {
  order: OrderListItem;
  unitPrice: number;
  /** The kilo price has moved in settings since this order was booked. */
  priceChanged: boolean;
  chickenCount: number;
  cleaning: boolean;
  onCleaningChange: (cleaning: boolean) => void;
  isSplit: boolean;
  onSplit: () => void;
  onUnsplit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-4 px-screen pt-4">
      <header className="flex items-center justify-between">
        <h2 className="text-h6 font-bold text-heading">اضافة اوزان الطلب</h2>
        <CloseButton onClick={onClose} />
      </header>

      <WeighingHeader
        order={order}
        unitPrice={unitPrice}
        priceChanged={priceChanged}
        chickenCount={chickenCount}
        cleaning={cleaning}
        onCleaningChange={onCleaningChange}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-bold text-heading">
          ضع الوزن الصافي (كجم)
        </span>
        <Checkbox
          label="تقسيم الطلب"
          checked={isSplit}
          onChange={(checked) => (checked ? onSplit() : onUnsplit())}
        />
      </div>
    </div>
  );
}
