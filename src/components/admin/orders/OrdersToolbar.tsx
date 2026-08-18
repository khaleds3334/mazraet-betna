import { Icon } from "@/components/ui";
import type { CustomerOption } from "@/lib/queries/customers";
import { AddOrderLauncher } from "./AddOrderLauncher";

/**
 * Top row of the orders screen (A-50): the "اضافة طلب" action on the right and
 * the cycle filter on the left. DOM order is right-to-left, the way the row reads.
 *
 * The funnel is drawn but inert for now — it will open a cycle picker, and that
 * picker has no design yet (Khaled, 2026-08-18). It stays a plain glyph rather
 * than a button, so nothing is tappable that does nothing.
 */
export function OrdersToolbar({
  customers,
  weights,
  defaultCleaning,
}: {
  customers: CustomerOption[];
  weights: number[];
  defaultCleaning: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-screen">
      <AddOrderLauncher
        customers={customers}
        weights={weights}
        defaultCleaning={defaultCleaning}
      />

      {/* 2px is the weight Figma draws it at. The icon's own stroke scales with
          `size`, so at 38px it would render ~2.4px and read heavy. */}
      <Icon
        name="filter"
        size={38}
        strokeWidth={2}
        absoluteStrokeWidth
        className="shrink-0 text-foreground"
      />
    </div>
  );
}
