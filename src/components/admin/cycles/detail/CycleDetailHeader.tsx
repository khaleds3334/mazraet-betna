import { Badge, BackButton, Icon } from "@/components/ui";
import { ChickIcon } from "@/components/admin/shared/ChickIcon";
import { formatArabicDate, formatArabicNumber } from "@/lib/format";
import type { CycleDetail } from "@/lib/queries/cycle-detail";

/**
 * Top of a cycle's page (A-45): the way back on the inline-start, then the cycle's
 * name with its phase pill, and under them when it ran and on how many chicks.
 *
 * It stays put while the figures scroll under it — this is the only thing on the
 * screen that says *which* cycle all those numbers belong to.
 */
export function CycleDetailHeader({ cycle }: { cycle: CycleDetail }) {
  return (
    <header className="flex flex-col gap-2 bg-background px-screen pb-3 pt-4">
      <div className="flex items-center gap-3">
        <BackButton href="/admin/cycles" className="shrink-0" />

        <h1 className="flex min-w-0 items-center gap-2">
          <Icon name="cycle" size={24} className="shrink-0 text-foreground" aria-hidden />
          <span className="truncate text-h6 font-bold text-primary-foreground">
            {cycle.name ?? "دورة بدون اسم"}
          </span>
        </h1>

        <Badge tone="danger" size="sm" className="shrink-0">
          دورة منتهية
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-disabled">
        <span className="flex items-center gap-1.5">
          <Icon name="calendarStart" size={14} aria-hidden />
          {/* yyyy/M/d so the digit run reads day → month → year right-to-left. */}
          بدأ في : {formatArabicDate(cycle.startDate, "yyyy/M/d")}
          {cycle.endedAt && (
            <> · الي : {formatArabicDate(cycle.endedAt, "yyyy/M/d")}</>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          <ChickIcon size={15} />
          عدد الكتاكيت : {formatArabicNumber(cycle.chickCount)}
        </span>
      </div>
    </header>
  );
}
