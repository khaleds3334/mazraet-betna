"use client";

import { Icon, Modal } from "@/components/ui";
import type { FeedWithdrawal } from "@/lib/queries/cycles";
import {
  arabicOrdinal,
  formatArabicDate,
  formatArabicTime,
  pluralizeBags,
  pluralizeDay,
} from "@/lib/format";
import { FEED_PHASE_LABEL } from "@/lib/constants";

/**
 * The bag-detail popup (A-13): tap a lit square on the consumption grid to see
 * which bag it was — which bag of its own feed, its type (بادي/نامي), how much the
 * flock had already eaten, the age that day, and the exact day/time it was opened.
 * Read-only; closes on scrim tap / Escape.
 *
 * **The name counts within the feed, not across the cycle** (D-45): بادي and نامي
 * each start at «الأولى», and a half opening reads «نصف الشكارة الثانية» without
 * promoting itself to a bag of its own. The old running count made «الشكارة رقم ٣»
 * mean two and a half bags of two different feeds.
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
          {/* Which bag of its feed, centered; the feed itself on the left. */}
          <div className="relative flex h-6 items-center justify-between">
            <span className="absolute end-0 text-h6 font-bold text-accent-brown">
              {FEED_PHASE_LABEL[withdrawal.phase]}
            </span>
            <p className="text-h6 font-bold text-accent-brown">
              {withdrawal.bags === 0.5 ? "نصف " : ""}
              الشكارة {arabicOrdinal(withdrawal.phaseIndex)}
            </p>
          </div>

          <div className="h-px w-full bg-border" />

          {/* What the flock had already got through when this one was opened —
              both feeds together, since that is what "eaten so far" means. */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Icon
                name="weight"
                size={24}
                className="text-foreground"
                aria-hidden
              />
              <span className="text-sm text-muted">أكلوا قبلها</span>
            </div>
            <span className="text-h6 font-bold text-foreground">
              {pluralizeBags(withdrawal.eatenBefore)}
            </span>
          </div>

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
