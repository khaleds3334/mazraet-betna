"use client";

import { useState } from "react";
import { CycleStatCard } from "@/components/admin/home/shared/CycleStatCard";
import { formatArabicNumber } from "@/lib/format";
import type { CycleExpenses } from "@/lib/queries/expenses";
import { CycleExpensesSheet } from "./CycleExpensesSheet";

/**
 * The «مصاريف الدورة» tile, wherever a cycle's figures are shown — and the sheet
 * behind it (A-47). One number is what fits on a dashboard; tapping it opens
 * where the money went.
 *
 * A tile is not obviously a control, so the whole card is the target and it
 * presses like one. The breakdown arrives with the page rather than on tap: it
 * is a few dozen rows the server has already read, and the admin taps this while
 * standing over a scale — a spinner here would be a spinner he waits out.
 *
 * `label` differs by screen: «مصاريف الدورة» on a running cycle, «اخر المصاريف»
 * between cycles, where the number belongs to the cycle that just closed.
 *
 * **Brown until it passes the forecast, then red — but only where a forecast is
 * handed in** (D-47). Spending money is what a cycle does, and on the *raising*
 * dashboard a permanently red tile sat beside a red mortality figure and
 * sometimes red feed counts; three reds on one screen train the eye to skip all
 * of them. There, red is earned: this cycle has cost more than A-41 said it
 * would.
 *
 * **Everywhere else the tile is simply red**, as it always was. The selling
 * dashboard is not a screen about the budget — it is about birds and money moving
 * — and «اخر المصاريف» between cycles reports a cycle that is closed and has
 * nothing left to decide. Leaving `estimated` out is how a screen says "no verdict
 * here" (Khaled, 2026-08-21). A cycle registered before migration 018 has no
 * forecast either, and lands in the same place.
 */
export function CycleExpensesCard({
  total,
  estimated,
  expenses,
  label = "مصاريف الدورة",
}: {
  total: number;
  /** «المصاريف المتوقعة» from A-41. Null = this cycle was never given one. */
  estimated?: number | null;
  expenses: CycleExpenses;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  // No forecast handed in → no judgement to make, and the tile keeps the red it
  // has always had.
  const judged = estimated != null && estimated > 0;
  const danger = !judged || total > estimated;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex w-full transition-transform active:scale-[0.98]"
      >
        <CycleStatCard
          icon="payment"
          label={label}
          value={formatArabicNumber(total)}
          tone={danger ? "danger" : "brown"}
        />
      </button>

      <CycleExpensesSheet
        open={open}
        onClose={() => setOpen(false)}
        expenses={expenses}
      />
    </>
  );
}
