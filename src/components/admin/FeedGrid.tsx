import { toArabicDigits } from "@/lib/format";

/**
 * "تتبع استهلاك العلف" — a calendar of the whole cycle: one square per day, from
 * day 1 until the flock is sold (~40 days), 10 per row. A square lights up on any
 * day a feed bag was withdrawn. RTL, so day 1 is the top-right square. Fluid
 * (aspect-square cells) so it never overflows the 320px floor.
 */
export function FeedGrid({
  totalDays,
  withdrawalDays,
}: {
  totalDays: number;
  withdrawalDays: number[];
}) {
  const lit = new Set(withdrawalDays);

  return (
    <div
      className="grid grid-cols-10 gap-1"
      role="img"
      aria-label={`${toArabicDigits(lit.size)} يوم اتسحب فيه علف من ${toArabicDigits(totalDays)} يوم`}
    >
      {Array.from({ length: totalDays }, (_, day) => (
        <div
          key={day}
          title={`اليوم ${toArabicDigits(day + 1)}`}
          className={`aspect-square rounded-[3px] border border-border ${
            lit.has(day) ? "bg-accent-orange" : "bg-background"
          }`}
        />
      ))}
    </div>
  );
}
