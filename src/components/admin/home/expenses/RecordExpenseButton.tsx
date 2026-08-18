"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui";
import type { CycleDashboard } from "@/lib/queries/cycles";
import { ExpenseSheet } from "./ExpenseSheet";

/**
 * "تسجيل مصاريف" (A-15): the dashboard pill that opens the expense sheet. Feed
 * data is passed through so the sheet's العلف form can show the live figures and
 * pre-fill the needed bags.
 */
export function RecordExpenseButton({
  feed,
  className,
}: {
  feed: CycleDashboard["feed"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionButton
        variant="outline"
        icon="expenseEdit"
        onClick={() => setOpen(true)}
        className={className}
      >
        تسجيل مصاريف
      </ActionButton>

      <ExpenseSheet open={open} onClose={() => setOpen(false)} feed={feed} />
    </>
  );
}
