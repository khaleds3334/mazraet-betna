"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton, CloseButton, Modal, PickerField } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { addFeedWithdrawal } from "@/lib/actions/expenses";
import { formatArabicDate, formatArabicTime } from "@/lib/format";

/** Today as `yyyy-mm-dd` / now as `HH:mm`, so the admin can just tap حفظ. */
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowHHMM = () => new Date().toTimeString().slice(0, 5);

/**
 * "سحب شكارة" (A-13): the dashboard pill plus its "امتي فتحت الشكارة؟" popup — a
 * day picker + a time picker + حفظ. Saving records one opened bag on the chosen
 * day, which lights that day's square on the consumption grid and lowers العلف
 * المتوفر. Recording isn't a critical action, so success/failure use a toast and
 * the figures refresh on their own. Per D-17 the record is day-based; the time is
 * captured in the form but the grid keys off the day.
 */
export function RecordFeedWithdrawalButton({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(todayISO);
  const [time, setTime] = useState(nowHHMM);
  const [submitting, setSubmitting] = useState(false);

  function close() {
    setOpen(false);
    setDay(todayISO());
    setTime(nowHHMM());
  }

  async function save() {
    if (!day) {
      toast.error("اختار يوم فتح الشكارة الأول");
      return;
    }
    setSubmitting(true);
    const res = await addFeedWithdrawal({ withdrawnOn: day, withdrawnAt: time });
    setSubmitting(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("تم تسجيل سحب الشكارة");
    close();
    router.refresh();
  }

  return (
    <>
      <ActionButton
        variant="outline"
        icon="add"
        onClick={() => setOpen(true)}
        className={className}
      >
        سحب شكارة
      </ActionButton>

      <Modal
        open={open}
        onClose={close}
        label="امتي فتحت الشكارة؟"
        header={
          /* Title on the right, close on the left (app convention). */
          <div className="flex items-center justify-between">
            <p className="text-accent-brown">امتي فتحت الشكارة؟</p>
            <CloseButton onClick={close} size="sm" />
          </div>
        }
      >
        <div className="flex flex-col gap-5 pt-5">
          {/* Day on the right, time on the left — matches the design. */}
          <div className="grid grid-cols-2 gap-3">
            <PickerField
              id="withdrawal-day"
              label="اختار اليوم"
              placeholder="اختار التاريخ"
              icon="dateTime"
              type="date"
              value={day}
              display={day ? formatArabicDate(day) : ""}
              onChange={setDay}
            />
            <PickerField
              id="withdrawal-time"
              label="اختار الوقت"
              placeholder="اختر موعد"
              icon="arrowDown"
              type="time"
              value={time}
              display={time ? formatArabicTime(time, { period: "long" }) : ""}
              onChange={setTime}
            />
          </div>

          <ActionButton
            variant="primary"
            onClick={save}
            isLoading={submitting}
            className="min-w-[152px] self-end px-8"
          >
            حفظ
          </ActionButton>
        </div>
      </Modal>
    </>
  );
}
