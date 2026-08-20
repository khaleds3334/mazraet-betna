import type { CustomerOption } from "@/lib/queries/customers";
import type { OrdersCycle } from "@/lib/queries/cycles";
import { AddOrderLauncher } from "./add/AddOrderLauncher";
import { CyclePickerButton } from "./CyclePickerButton";
import { OrderTabChip } from "./OrderTabChip";

/**
 * Top row of the orders screen (A-50) — the cycle picker on the inline-end, and
 * on the inline-start whichever of two things the cycle calls for.
 *
 * **Selling:** «اضافة طلب». Orders are arriving, and one can be booked.
 *
 * **Any other cycle:** the count of what it came to, beside its name. Nothing can
 * be added to a cycle that isn't selling (D-39), so the button would be a button
 * that refuses; and every order in a closed cycle is completed, so the three tabs
 * collapse into the only one that has anything in it (Khaled, 2026-08-20). The
 * chip is the same chip the tab bar draws, without the tapping.
 */
export function OrdersToolbar({
  cycle,
  cycles,
  orderCount,
  customers,
  weights,
  defaultCleaning,
}: {
  /** The cycle being shown — the picker marks it, and the archive names it. */
  cycle: OrdersCycle;
  cycles: OrdersCycle[];
  /** Orders in that cycle — the archive chip's number. */
  orderCount: number;
  customers: CustomerOption[];
  weights: number[];
  defaultCleaning: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-screen">
      {cycle.saleOpen ? (
        <AddOrderLauncher
          customers={customers}
          weights={weights}
          defaultCleaning={defaultCleaning}
          saleOpen
        />
      ) : (
        <div className="flex min-w-0 items-center gap-3">
          <OrderTabChip tab="done" label="المكتملة" count={orderCount} selected />
          <span className="truncate text-base font-bold text-heading">
            {cycle.name ?? "دورة بدون اسم"}
          </span>
        </div>
      )}

      <CyclePickerButton cycles={cycles} selectedId={cycle.cycleId} />
    </div>
  );
}
