import { StatItem } from "@/components/ui";
import type { CycleDashboard } from "@/lib/queries/cycles";
import {
  formatArabicNumber,
  pluralizeChicken,
  pluralizeDay,
} from "@/lib/format";
import { CycleHeader } from "../shared/CycleHeader";
import { CycleStatCard } from "../shared/CycleStatCard";
import { StatSection } from "../shared/StatSection";
import { RecordExpenseButton } from "../expenses/RecordExpenseButton";
import { RecordMortalityButton } from "./RecordMortalityButton";
import { RecordFeedWithdrawalButton } from "./RecordFeedWithdrawalButton";
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
    <div className="flex flex-1 flex-col gap-6 px-screen pb-6 pt-3">
      <CycleHeader
        name={data.name}
        startDate={data.startDate}
        chickCount={data.chickCount}
        badgeLabel="مرحلة التربية"
      />
      <div className="flex gap-3 flex-col">
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
          <RecordExpenseButton feed={feed} className="flex-1" />
          <RecordMortalityButton className="shrink-0" />
        </div>
      </div>

      {/* Feed section — required · withdrawn · available (right→left). */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <StatItem
            label={"العلف\nالمطلوب"}
            value={`${formatArabicNumber(Math.round(feed.requiredBadi))} / ${formatArabicNumber(Math.round(feed.requiredNami))}`}
          />
          <StatItem
            label={"العلف\nالمسحوب"}
            value={formatArabicNumber(feed.withdrawn)}
            valueClassName="text-accent-tan"
          />
          <StatItem
            label={"العلف\nالمتوفر"}
            value={formatArabicNumber(feed.available)}
          />
        </div>

        {/* Withdraw-bag button — centered, at roughly the تسجيل مصاريف width. */}
        <div className="flex justify-center">
          <RecordFeedWithdrawalButton className="w-2/3" />
        </div>
      </div>

      {/* Feed consumption tracker — one square per cycle day. */}
      <StatSection title="تتبع استهلاك العلف">
        <FeedGrid totalDays={feed.totalDays} withdrawals={feed.withdrawals} />
      </StatSection>

      <StartSellingButton enabled={data.saleReady} salePrice={data.salePrice} />
    </div>
  );
}
