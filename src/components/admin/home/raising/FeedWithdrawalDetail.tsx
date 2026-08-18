"use client";

import { Icon, Modal } from "@/components/ui";
import type { FeedWithdrawal } from "@/lib/queries/cycles";
import {
  formatArabicDate,
  formatArabicNumber,
  formatArabicTime,
  pluralizeDay,
} from "@/lib/format";

const PHASE_LABEL: Record<FeedWithdrawal["phase"], string> = {
  badi: "بادي",
  nami: "نامي",
};

/**
 * The bag-detail popup (A-13): tap a lit square on the consumption grid to see
 * which bag it was — its number, its type (بادي/نامي), the flock's age that day,
 * and the exact day/time it was opened. Read-only; closes on scrim tap / Escape.
 */
export function FeedWithdrawalDetail({
  withdrawal,
  onClose,
}: {
  withdrawal: FeedWithdrawal | null;
  onClose: () => void;
}) {
  return (
    <Modal open={withdrawal !== null} onClose={onClose} label="تفاصيل الشكارة">
      {withdrawal && (
        <div className="flex flex-col gap-4">
          {/* Bag number centered, feed type on the left. */}
          <div className="relative flex h-6 items-center justify-between">
            <span className="absolute end-0 text-h6 font-bold text-accent-brown">
              {PHASE_LABEL[withdrawal.phase]}
            </span>
            <p className="text-h6 font-bold text-accent-brown">
              الشكارة رقم {formatArabicNumber(withdrawal.bagNumber)}
            </p>
          </div>

          <div className="h-px w-full bg-border" />

          {/* Flock age (left) · "عمر الفراخ" + calendar (right). */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Icon name="calendar" size={24} className="text-foreground" aria-hidden />
              <span className="text-sm text-muted">عمر الفراخ</span>
            </div>
            <span className="text-h6 font-bold text-foreground">
              {pluralizeDay(withdrawal.ageDays)}
            </span>
          </div>

          {/* Full day + time it was opened. */}
          <p className="text-center text-xs text-disabled">
            {formatArabicDate(withdrawal.withdrawnOn, "EEEE d MMMM yyyy")}
            {withdrawal.withdrawnAt
              ? ` الساعة ${formatArabicTime(withdrawal.withdrawnAt)}`
              : ""}
          </p>
        </div>
      )}
    </Modal>
  );
}
