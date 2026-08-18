import { Badge, Icon } from "@/components/ui";
import { SettingsGear } from "@/components/layout/SettingsGear";
import { formatArabicDate, formatArabicNumber } from "@/lib/format";
import { ChickIcon } from "./ChickIcon";

/**
 * Top of the cycle dashboard (A-11): the settings gear on the inline-end, and
 * the active cycle's identity on the inline-start — its name, a phase badge, and
 * two meta lines (start date, flock size). Phase badge text/tone is passed in so
 * the same header serves the raising and selling dashboards.
 */
export function CycleHeader({
  name,
  startDate,
  chickCount,
  badgeLabel,
}: {
  name: string | null;
  startDate: string;
  chickCount: number;
  badgeLabel: string;
}) {
  return (
    <header className="flex flex-col">
      {/* The settings gear sits alone at the top, on the inline-end (left in RTL). */}
      <SettingsGear size={30} />

      {/* The cycle identity, aligned to the inline-start (right in RTL). */}
      <div className="flex flex-col items-start gap-2">
        {/* Row 1: cycle icon + name, then the phase badge to its inline-end. */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Icon name="cycle" size={24} className="text-foreground" aria-hidden />
            <h1 className="text-h6 font-bold text-primary-foreground">
              {name ?? "الدورة الحالية"}
            </h1>
          </div>
          <Badge tone="success" size="sm">
            {badgeLabel}
          </Badge>
        </div>

        {/* Row 2: two muted meta items — start date and flock size. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-disabled">
          <span className="flex items-center gap-1.5">
            <Icon name="calendarStart" size={14} aria-hidden />
            {/* yyyy/M/d so the digit run renders day → month → year right-to-left. */}
            بدأ في : {formatArabicDate(startDate, "yyyy/M/d")}
          </span>
          <span className="flex items-center gap-1.5">
            <ChickIcon size={15} />
            عدد الكتاكيت : {formatArabicNumber(chickCount)}
          </span>
        </div>
      </div>
    </header>
  );
}
