import type { CustomerOption } from "@/lib/queries/customers";
import type { OrdersCycle } from "@/lib/queries/cycles";
import { AddOrderLauncher } from "./add/AddOrderLauncher";
import { CyclePickerButton } from "./CyclePickerButton";
import { OrderTabChip } from "./OrderTabChip";

/**
 * Top row of the orders screen (A-50) — the cycle picker on the inline-end, and
 * on the inline-start whichever of two things the cycle calls for.
 *
 * **Selling:** «اضافة طلب», with the cycle's name beside it — the screen shows one
 * cycle at a time and the funnel can move it, so it says which one either way.
 *
 * **Any other cycle:** the count of what it came to, beside its name. Nothing can
 * be added to a cycle that isn't selling (D-39), so the button would be a button
 * that refuses; and every order in a closed cycle is completed — `endCycle` won't
 * close one over an open order — so the three tabs collapse into the only one that
 * has anything in it (Khaled, 2026-08-20). The chip is the same chip the tab bar
 * draws, without the tapping.
 *
 * `allDone` is false only for a cycle carrying orders from before that rule
 * existed. The chip then says «الطلبات» rather than claiming they are finished:
 * the list is showing them either way, and a label that lies about a pending order
 * is worse than a plainer one.
 */
export function OrdersToolbar({
  cycle,
  cycles,
  orderCount,
  allDone,
  available,
  customers,
  weights,
  defaultCleaning,
  salePrice,
  cleaningPrice,
}: {
  /** The cycle being shown — the picker marks it, and the archive names it. */
  cycle: OrdersCycle;
  cycles: OrdersCycle[];
  /** Orders in that cycle — the archive chip's number. */
  orderCount: number;
  /** Whether every one of them is delivered or cancelled. */
  allDone: boolean;
  /** Birds still free to sell on the running cycle — the ceiling on a new order. */
  available: number;
  customers: CustomerOption[];
  weights: number[];
  defaultCleaning: boolean;
  /** Live settings — handed on to the weighing sheet «اضافة طلب» can open. */
  salePrice: number;
  cleaningPrice: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-screen">
      <div className="flex min-w-0 items-center gap-3">
        {/* The phase, not the switch: a sale closed for an afternoon still has
            orders to add to, and the sheet is where «البيع مقفول» is explained
            (`AddOrderSheet`) rather than by a button that has disappeared. */}
        {cycle.phase === "selling" ? (
          <AddOrderLauncher
            customers={customers}
            weights={weights}
            defaultCleaning={defaultCleaning}
            salePrice={salePrice}
            cleaningPrice={cleaningPrice}
            saleOpen={cycle.saleOpen}
            available={available}
          />
        ) : (
          <OrderTabChip
            tab="done"
            label={allDone ? "المكتملة" : "الطلبات"}
            count={orderCount}
            selected
          />
        )}

        <span className="truncate text-base font-bold text-heading">
          {cycle.name ?? "دورة بدون اسم"}
        </span>
      </div>

      <CyclePickerButton cycles={cycles} selectedId={cycle.cycleId} />
    </div>
  );
}
