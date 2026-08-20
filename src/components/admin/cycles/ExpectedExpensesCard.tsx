"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { formatArabicNumber, formatCurrency } from "@/lib/format";
import type {
  CycleEstimateBasis,
  EstimatedCycleExpenses,
} from "@/lib/calculations/cycle";

/**
 * "المصاريف المتوقعة" on the create-cycle sheet (A-41). Closed, it is the plain
 * stat tile the design draws — caption, then the total in red. Tapping it opens
 * the three lines the total is made of, each with the sum behind it: how many
 * bags at what price, which flock the other expenses came from (T-46).
 *
 * Why it opens rather than showing everything: only the total belongs on the
 * screen every time. The workings matter on the first cycle after a price
 * change, when the admin's real question is «هو بيحسب الشكارة بكام؟» — and a
 * number he can check is a number he can trust.
 *
 * Not a `StatItem`: that one is a plain tile by design, and this needs to be one
 * control that expands. It borrows the same tokens so the two read as one family
 * — keep them in step if StatItem's box ever changes.
 */
export function ExpectedExpensesCard({
  expenses,
  chickCount,
  chickPrice,
  basis,
}: {
  expenses: EstimatedCycleExpenses;
  chickCount: number;
  chickPrice: number;
  basis?: CycleEstimateBasis;
}) {
  const [open, setOpen] = useState(false);
  const previous = basis?.previous;

  // Bags round to the nearest half, so show a decimal only when there is one.
  const bags = formatArabicNumber(expenses.bags, {
    decimals: Number.isInteger(expenses.bags) ? 0 : 1,
  });

  return (
    <div className="w-full rounded-xl border-2 border-border bg-surface-page">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex min-h-11 w-full flex-col items-center gap-1 px-2 py-3 text-center"
      >
        <span className="flex items-center gap-1 text-sm text-muted">
          المصاريف المتوقعة
          <Icon
            name="arrowDown"
            size={18}
            className={open ? "rotate-180 transition-transform" : "transition-transform"}
          />
        </span>
        <span className="text-h4 font-bold text-error">
          {formatCurrency(expenses.total)}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t-2 border-border px-4 py-3">
          <Line
            label="الكتاكيت"
            note={`${formatArabicNumber(chickCount)} × ${formatCurrency(chickPrice)}`}
            value={expenses.chicks}
          />
          <Line
            label="العلف"
            note={`${bags} شكارة × ${formatCurrency(expenses.bagPrice)}`}
            // The price is a real invoice from the farm unless this is the first
            // cycle ever — say which, so a surprising number can be traced.
            hint={
              expenses.bagPriceFromHistory
                ? "سعر اخر شكارة اشتريتها"
                : "سعر تقديري، لسه مشتريتش علف"
            }
            value={expenses.feed}
          />
          <Line
            label="باقي المصاريف"
            note={
              previous
                ? `${formatCurrency(previous.otherExpenses)} على ${formatArabicNumber(previous.chickCount)} كتكوت`
                : "مفيش دورة قبل كده"
            }
            hint={previous ? "مياه وكهربا وأدوية الدورة اللي فاتت" : undefined}
            value={expenses.other}
          />
        </div>
      )}
    </div>
  );
}

/**
 * One line of the breakdown: the name and its workings on the right, the money
 * on the left (first child is the right one in RTL).
 */
function Line({
  label,
  note,
  hint,
  value,
}: {
  label: string;
  note: string;
  hint?: string;
  value: number;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5 text-right">
        <span className="text-base text-foreground">{label}</span>
        <span className="text-sm text-muted">{note}</span>
        {hint && <span className="text-xs text-disabled">{hint}</span>}
      </div>
      <span className="shrink-0 text-base font-bold text-heading">
        {formatCurrency(value)}
      </span>
    </div>
  );
}
