"use client";

import { BottomSheet, CloseButton, Icon } from "@/components/ui";
import { formatArabicNumber, formatCurrency } from "@/lib/format";
import type { CycleExpenses, ExpenseLine } from "@/lib/queries/expenses";

/** Column widths, shared by the head and every row so they line up as one grid. */
const ITEM_COL = "w-[38%] shrink-0";
const NUM_COL = "flex-1 min-w-0 text-center";

/** One line of the table: what it was, how many, at what price, and the product. */
function Row({ line }: { line: ExpenseLine }) {
  return (
    <div className="flex items-center gap-2 text-base text-heading">
      <span className={`${ITEM_COL} text-center`}>{line.label}</span>
      <span className={NUM_COL}>{formatArabicNumber(line.quantity)}</span>
      <span className={NUM_COL}>{formatArabicNumber(line.unitPrice)}</span>
      <span className={NUM_COL}>{formatArabicNumber(line.total)}</span>
    </div>
  );
}

/**
 * A cycle's spending, itemised (A-47_Cycle_Expenses) — the sheet behind the
 * «مصاريف الدورة» tile. Four columns (الصنف · العدد · السعر · الاجمالي), the rows
 * grouped by what they were spent on, each group closing with its own subtotal,
 * and the cycle's whole spend at the foot.
 *
 * Read-only. Recording an expense is a different sheet (A-15) — this one only
 * answers "where did it go?", which is the question the tile provokes.
 */
export function CycleExpensesSheet({
  open,
  onClose,
  expenses,
}: {
  open: boolean;
  onClose: () => void;
  expenses: CycleExpenses;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label="مصاريف الدورة"
      header={
        <div className="flex flex-col gap-3 px-screen pt-5">
          {/* Title on the right, close on the left (app convention). */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-h6 font-bold text-heading">مصاريف الدورة</h2>
            <CloseButton onClick={onClose} />
          </div>

          {/* Column heads, pinned with the title so a long table keeps them. */}
          <div className="flex items-center gap-2 border-b-2 border-border py-2.5 text-base font-bold text-primary-foreground">
            <span className={`${ITEM_COL} text-center`}>الصنف</span>
            <span className={NUM_COL}>العدد</span>
            <span className={NUM_COL}>السعر</span>
            <span className={NUM_COL}>الاجمالي</span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6 px-screen pb-2 pt-4">
        {expenses.groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {group.lines.map((line, index) => (
                <Row key={`${group.key}-${index}`} line={line} />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 text-base font-bold text-heading">
              <span>{group.totalLabel}</span>
              <span>{formatCurrency(group.total)}</span>
            </div>
          </div>
        ))}

        {/* The cycle's whole spend — it closes the table. */}
        <div className="flex flex-col items-center gap-1 border-t-2 border-border pt-6 text-center">
          <span className="flex items-center gap-1 text-sm text-muted">
            <Icon name="payment" size={18} aria-hidden />
            اجمالي مصاريف الدورة
          </span>
          <span className="text-h4 font-bold text-error">
            {formatCurrency(expenses.total)}
          </span>
        </div>
      </div>
    </BottomSheet>
  );
}
