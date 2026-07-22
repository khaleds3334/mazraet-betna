"use client";

import { useCountdown } from "@/hooks/useCountdown";
import { formatArabicDate, toArabicDigits } from "@/lib/format";
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

export function SaleStatusCard({
  saleOpen,
  targetDate,
}: {
  saleOpen: boolean;
  targetDate: string | null;
}) {
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
        {saleOpen ? "البيع متوفر" : "البيع مغلق"}
      </span>

      <div className="flex w-full flex-col items-center gap-2 text-heading">
        <p className="text-center text-h6 font-bold">
          {saleOpen
            ? "العد التنازلي لانتهاء فترة البيع"
            : "العد التنازلي لبدء فترة البيع"}
        </p>

        <div className="flex w-full items-center justify-between text-sm">
          <p>{saleOpen ? "فترة البيع تنتهي في" : "فترة البيع تبدأ في"}</p>
          <p>{targetDate ? formatArabicDate(targetDate) : "—"}</p>
        </div>

        <div className="flex w-full items-center gap-4 font-bold">
          {UNITS.map((unit) => (
            <div
              key={unit.key}
              className={cn(
                "flex min-w-0 flex-1 basis-0 flex-col items-center justify-end rounded-md px-2 py-2 text-primary-foreground",
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
