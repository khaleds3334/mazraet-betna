import { StatItem } from "@/components/ui";
import type { CycleDashboard } from "@/lib/queries/cycles";
import {
  formatArabicNumber,
  pluralizeChicken,
  pluralizeDay,
} from "@/lib/format";
import { CycleHeader } from "./CycleHeader";
import { CycleStatCard } from "./CycleStatCard";
import { CycleActionButton } from "./CycleActionButton";
import { RecordMortalityButton } from "./RecordMortalityButton";
import { FeedGrid } from "./FeedGrid";
import { StartSellingButton } from "./StartSellingButton";

/**
 * Admin home while a cycle is in the raising phase (A-11_Home_Raising): the
 * cycle header, the three headline figures (mortality · expenses · age), the
 * record actions, the feed section (available / withdrawn / required + the
 * consumption grid), and the "start selling" button — disabled until the flock
 * reaches selling age. Pure view: every number comes pre-computed on `data`.
 */
export function RaisingDashboard({ data }: { data: CycleDashboard }) {
  const { feed } = data;

  return (
    <div className="flex flex-1 flex-col gap-6 px-screen pb-6 pt-4">
      <CycleHeader
        name={data.name}
        startDate={data.startDate}
        chickCount={data.chickCount}
        badgeLabel="مرحلة التربية"
      />

      {/* Three headline figures. DOM order is right→left (RTL): age · expenses ·
          mortality, matching the design's on-screen order. */}
      <div className="grid grid-cols-3 gap-2">
        <CycleStatCard
          icon="calendar"
          label="عمر الفراخ"
          value={pluralizeDay(data.ageDays)}
          tone="brand"
        />
        <CycleStatCard
          icon="payment"
          label="مصاريف الدورة"
          value={formatArabicNumber(data.expensesTotal)}
          
          tone="danger"
        />
        <CycleStatCard
          icon="mortality"
          label="عدد النافق"
          value={pluralizeChicken(data.mortalityCount)}
          tone="danger"
        />
      </div>

      {/* Record actions — expenses (wide) on the right, mortality on the left. */}
      <div className="flex items-stretch justify-between gap-3">
        <CycleActionButton
          label="تسجيل مصاريف"
          icon="expenseEdit"
          variant="outline"
          className="flex-1"
        />
        <RecordMortalityButton className="shrink-0" />
      </div>

      {/* Feed section — required · withdrawn · available (right→left). */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <StatItem
            label="العلف المطلوب"
            value={`${formatArabicNumber(Math.round(feed.requiredBadi))} / ${formatArabicNumber(Math.round(feed.requiredNami))}`}
          />
          <StatItem
            label="العلف المسحوب"
            value={formatArabicNumber(feed.withdrawn)}
            valueClassName="text-accent-tan"
          />
          <StatItem label="العلف المتوفر" value={formatArabicNumber(feed.available)} />
        </div>

        <div className="flex justify-center">
          <CycleActionButton label="سحب شكارة" icon="add" variant="outline" className="px-6" />
        </div>
      </div>

      {/* Feed consumption tracker — one square per cycle day. */}
      <div className="flex flex-col gap-3">
        <h2 className="text-h6 font-bold text-heading">تتبع استهلاك العلف</h2>
        <FeedGrid totalDays={feed.totalDays} withdrawalDays={feed.withdrawalDays} />
      </div>

      <StartSellingButton enabled={data.saleReady} />
    </div>
  );
}
