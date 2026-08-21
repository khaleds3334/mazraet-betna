import type { CycleDashboard } from "@/lib/queries/cycles";
import type { CycleExpenses } from "@/lib/queries/expenses";
import { pluralizeChicken, pluralizeDay } from "@/lib/format";
import { FeedTracker } from "@/components/admin/shared/FeedTracker";
import { RecordActions } from "@/components/admin/shared/RecordActions";
import { CycleExpensesCard } from "@/components/admin/shared/expenses/CycleExpensesCard";
import { CycleHeader } from "../shared/CycleHeader";
import { CycleStatCard } from "../shared/CycleStatCard";
import { StatSection } from "../shared/StatSection";
import { FeedGrid } from "@/components/admin/shared/FeedGrid";
import { StartSellingButton } from "./StartSellingButton";

/**
 * Admin home while a cycle is in the raising phase (A-11_Home_Raising): the
 * cycle header, the three headline figures (mortality · expenses · age), the
 * record actions, the feed section (available / withdrawn / required + the
 * consumption grid), and the "start selling" button — disabled until the flock
 * reaches selling age. Pure view: every number comes pre-computed on `data`.
 */
export function RaisingDashboard({
  data,
  expenses,
}: {
  data: CycleDashboard;
  expenses: CycleExpenses;
}) {
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
          <CycleExpensesCard
            total={data.expensesTotal}
            estimated={data.estimatedExpenses}
            expenses={expenses}
          />
          <CycleStatCard
            icon="mortality"
            label="عدد النافق"
            value={pluralizeChicken(data.mortalityCount)}
            tone="danger"
          />
        </div>

        <RecordActions feed={feed} />
      </div>

      <FeedTracker feed={feed} />

      {/* Feed consumption tracker — one square per cycle day. */}
      <StatSection title="تتبع استهلاك العلف">
        <FeedGrid totalDays={feed.totalDays} withdrawals={feed.withdrawals} />
      </StatSection>

      <StartSellingButton enabled={data.saleReady} salePrice={data.salePrice} />
    </div>
  );
}
