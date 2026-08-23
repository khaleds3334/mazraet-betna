"use client";

import { useCountdown } from "@/hooks/useCountdown";
import { formatArabicDate, toArabicDigits } from "@/lib/format";
import type { SaleStatus } from "@/lib/queries/cycles";
import { cn } from "@/lib/utils";

/**
 * The sale status card on the customer home (Component 60, states C-10→C-12).
 * Shows whether the sale is open, and a live countdown either to when it closes
 * (open) or to when it starts (closed). Colors flip green↔red with the state.
 *
 * Boxes render days→seconds; in RTL the first child sits on the right, so days
 * land on the right and seconds on the left, matching the design.
 */
const UNITS = [
  { key: "days", label: "يوم" },
  { key: "hours", label: "ساعة" },
  { key: "minutes", label: "دقيقة" },
  { key: "seconds", label: "ثانية" },
] as const;

/** Two Arabic-Indic digits, e.g. 8 → ٠٨, matching the design. */
function pad2(value: number): string {
  return toArabicDigits(String(value).padStart(2, "0"));
}

/**
 * What the badge and the two lines say in each state. «مغلق» covered three
 * different situations and the countdown under it meant something different in
 * each, which is how a sale that had run out of birds came to promise one
 * tomorrow (Khaled, 2026-08-22).
 */
const READING = {
  open: {
    badge: "البيع متوفر",
    heading: "العد التنازلي لانتهاء فترة البيع",
    when: "فترة البيع تنتهي في",
  },
  paused: {
    badge: "البيع مقفول مؤقتا",
    heading: "العد التنازلي لعودة البيع",
    when: "البيع يفتح تاني في",
  },
  "sold-out": {
    badge: "البيع مغلق",
    heading: "البيع خلص لهذه الدورة",
    when: "الفراخ خلصت",
  },
  waiting: {
    badge: "البيع مغلق",
    heading: "العد التنازلي لبدء فترة البيع",
    when: "فترة البيع تبدأ في",
  },
} as const satisfies Record<
  SaleStatus,
  { badge: string; heading: string; when: string }
>;

export function SaleStatusCard({
  status,
  targetDate,
}: {
  status: SaleStatus;
  targetDate: string | null;
}) {
  const saleOpen = status === "open";
  const reading = READING[status];
  const countdown = useCountdown(targetDate);
  const values: Record<(typeof UNITS)[number]["key"], number> = {
    days: countdown.days,
    hours: countdown.hours,
    minutes: countdown.minutes,
    seconds: countdown.seconds,
  };

  return (
    <section className="flex w-full flex-col items-center gap-4">
      <span
        className={cn(
          "rounded-full border px-4 pb-2 pt-1 text-base font-bold",
          saleOpen
            ? "border-accent-tan bg-accent-orange text-primary-foreground"
            : "border-error bg-error-soft text-white",
        )}
      >
        {reading.badge}
      </span>

      <div className="flex w-full flex-col items-center gap-2 text-heading">
        <p className="text-center text-h6 font-bold">{reading.heading}</p>

        <div className="flex w-full items-center justify-between text-sm">
          <p>{reading.when}</p>
          {/* Sold out has no date to give. The boxes below read ٠٠, which is the
              answer, and a dash beside it would be a second way of saying it. */}
          {targetDate && <p>{formatArabicDate(targetDate)}</p>}
        </div>

        <div className="flex w-full items-center justify-between gap-2 font-bold">
          {UNITS.map((unit) => (
            <div
              key={unit.key}
              className={cn(
                "flex min-w-0 flex-1 basis-0 flex-col items-center justify-end rounded-md px-3 pt-2 pb-3 text-heading gap-1",
                saleOpen ? "bg-primary" : "bg-error-muted",
              )}
            >
              <p suppressHydrationWarning className="text-[40px] leading-none">
                {pad2(values[unit.key])}
              </p>
              <p className="text-h5">{unit.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
