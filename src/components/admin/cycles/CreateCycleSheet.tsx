"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format as formatDate } from "date-fns";
import {
  BottomSheet,
  Button,
  CloseButton,
  InlineError,
  InputField,
  NumberStepper,
  PickerField,
  StatItem,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { createCycle } from "@/lib/actions/cycles";
import { expectedFeedBags } from "@/lib/calculations/feed";
import { estimatedCycleExpenses } from "@/lib/calculations/cycle";
import {
  formatArabicDate,
  formatArabicNumber,
  formatArabicTime,
  formatCurrency,
} from "@/lib/format";

/**
 * "إنشاء دورة جديدة" (A-41) — the bottom sheet that registers a cycle (FR-4):
 * name (optional), start day + time, chick count and price. The feed and
 * expected-expenses cards update live from the count/price (both provisional —
 * see the calculations). Success shows a toast and closes; failure keeps the
 * sheet open with an inline error so the message doesn't vanish.
 */
export function CreateCycleSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [chickCount, setChickCount] = useState(0);
  const [chickPrice, setChickPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill sensible defaults every time the sheet opens: today's date/time and
  // a name from the current month/year ("دورة يناير ٢٠٢٦") — the admin usually
  // starts a cycle the same day they're registering it, so this saves taps.
  // Chick count/price are left at 0 since there's no sensible default for those.
  // Detected during render (React's "adjusting state on a prop change" pattern)
  // rather than a useEffect, so the reset lands before the opening paint instead
  // of one render late.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const now = new Date();
      setStartDate(formatDate(now, "yyyy-MM-dd"));
      setStartTime(formatDate(now, "HH:mm"));
      setName(`دورة ${formatArabicDate(now, "MMMM yyyy")}`);
      setError(null);
    }
  }

  const { badi, nami } = expectedFeedBags(chickCount);
  const expenses = estimatedCycleExpenses(chickCount, chickPrice);
  // Bags round to the nearest half (see expectedFeedBags) — show one decimal
  // only when there actually is a half-bag, so "٤" stays "٤" and not "٤.٠".
  const formatBags = (n: number) =>
    formatArabicNumber(n, { decimals: Number.isInteger(n) ? 0 : 1 });

  async function submit() {
    setError(null);
    if (chickCount <= 0) return setError("اكتب عدد الكتاكيت الأول.");
    if (!startDate) return setError("اختار تاريخ بداية الدورة.");

    setSubmitting(true);
    const res = await createCycle({
      name,
      startDate,
      startTime,
      chickCount,
      chickPrice,
    });
    setSubmitting(false);

    if (!res.ok) return setError(res.error);
    toast.success("تم تسجيل الدورة");
    onClose();
    router.refresh();
  }

  return (
    <BottomSheet open={open} onClose={onClose} label="انشاء دورة جديدة">
      <div className="flex flex-col gap-6 px-screen pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-h6 font-bold text-heading">انشاء دورة جديدة</h2>
          <CloseButton onClick={onClose} />
        </div>

        <InputField
          id="cycle-name"
          label="اسم الدورة"
          placeholder="مثال:  دورة يناير ٢٠٢٦"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <PickerField
            id="cycle-date"
            label="اختار اليوم"
            placeholder="اختار التاريخ"
            icon="dateTime"
            type="date"
            value={startDate}
            display={startDate ? formatArabicDate(startDate) : ""}
            onChange={setStartDate}
          />
          <PickerField
            id="cycle-time"
            label="اختار الوقت"
            placeholder="اختر موعد"
            icon="arrowDown"
            type="time"
            value={startTime}
            display={
              startTime ? formatArabicTime(startTime, { period: "long" }) : ""
            }
            onChange={setStartTime}
          />
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-right text-h6 font-bold text-foreground">
            عدد الكتاكيت و سعر الكتكوت
          </p>
          <div className="flex items-start justify-between">
            <NumberStepper
              label="عدد الكتاكيت"
              value={chickCount}
              onChange={setChickCount}
              step={50}
            />
            <NumberStepper
              label="سعر الكتكوت"
              value={chickPrice}
              onChange={setChickPrice}
              suffix="جنية"
            />
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-2">
          <StatItem
            label="العلف المطلوب"
            value={`${formatBags(badi)} بادي / ${formatBags(nami)} نامي`}
          />
          <StatItem
            label="المصاريف المتوقعة"
            value={formatCurrency(expenses)}
            valueClassName="text-error"
          />
        </div>

        {error && <InlineError message={error} />}

        <Button onClick={submit} isLoading={submitting}>
          تسجيل
        </Button>
      </div>
    </BottomSheet>
  );
}
