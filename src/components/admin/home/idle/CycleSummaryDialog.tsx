"use client";

import { Icon, Modal } from "@/components/ui";
import { ChickIcon } from "@/components/admin/shared/ChickIcon";
import type { IconName } from "@/lib/icons";
import {
  formatArabicDate,
  formatArabicNumber,
  formatCurrency,
  formatWeight,
  pluralizeDay,
} from "@/lib/format";
import type { CycleListItem } from "@/lib/queries/cycles";
import { cn } from "@/lib/utils";

/** One figure in the card's body: what it is on the right, how much on the left. */
function SummaryRow({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: IconName;
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1 text-sm text-muted">
        <Icon name={icon} size={24} aria-hidden />
        {label}
      </span>
      <span className={cn("text-h6 font-bold", valueClassName)}>{value}</span>
    </div>
  );
}

/**
 * A finished cycle's summary (A-22_Home_CycleEnded_Summary) — the card that
 * opens when the admin taps a cycle's bars on the idle home's chart. The chart
 * shows shapes; this is where the shapes become numbers.
 *
 * It has no close button, as the design draws it: the card is short, it asks
 * nothing, and tapping anywhere off it dismisses.
 */
export function CycleSummaryDialog({
  cycle,
  onClose,
}: {
  /** The cycle being summarised, or null when nothing is open. */
  cycle: CycleListItem | null;
  onClose: () => void;
}) {
  const title = cycle?.name ?? "ملخص الدورة";

  return (
    <Modal open={cycle !== null} onClose={onClose} label={title}>
      {cycle && (
        <div className="flex flex-col gap-4">
          {/* Identity on the inline-start, how long it ran on the inline-end. */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <h2 className="truncate text-h6 font-bold text-accent-brown">
                {title}
              </h2>
              <p className="flex items-center gap-1.5 text-xs text-disabled">
                <ChickIcon size={15} />
                عدد الكتاكيت : {formatArabicNumber(cycle.chickCount)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Icon
                name="calendar"
                size={24}
                className="text-accent-brown"
                aria-hidden
              />
              <span className="flex flex-col items-center gap-1 text-center">
                <span className="text-sm text-muted">مدة الدورة</span>
                <span className="text-h6 font-bold text-accent-brown">
                  {pluralizeDay(cycle.durationDays)}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <SummaryRow
              icon="payment"
              label="المصاريف"
              value={formatCurrency(cycle.expensesTotal)}
              valueClassName="text-error"
            />
            <SummaryRow
              icon="income"
              label="الربح"
              value={formatCurrency(cycle.netProfit)}
              // Red on a loss, the same rule the stat tiles follow.
              valueClassName={
                cycle.netProfit < 0 ? "text-error" : "text-foreground"
              }
            />
            <SummaryRow
              icon="weight"
              label="الاوزان"
              value={formatWeight(cycle.averageWeight)}
              valueClassName="text-accent-tan"
            />
          </div>

          {/* When it ran — centered under the figures. */}
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs text-disabled">
            <Icon name="calendarStart" size={14} aria-hidden />
            <span>بدأ في : {formatArabicDate(cycle.startDate, "yyyy/M/d")}</span>
            {cycle.endedAt && (
              <span>الي : {formatArabicDate(cycle.endedAt, "yyyy/M/d")}</span>
            )}
          </p>
        </div>
      )}
    </Modal>
  );
}
