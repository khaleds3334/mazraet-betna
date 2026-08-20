import { notFound, redirect } from "next/navigation";
import { StatItem, Icon } from "@/components/ui";
import { CycleDetailHeader } from "@/components/admin/cycles/detail/CycleDetailHeader";
import { WeightDistribution } from "@/components/admin/cycles/detail/WeightDistribution";
import { CycleStatCard } from "@/components/admin/home/shared/CycleStatCard";
import { StatSection } from "@/components/admin/home/shared/StatSection";
import { FeedGrid } from "@/components/admin/shared/FeedGrid";
import { CycleExpensesCard } from "@/components/admin/shared/expenses/CycleExpensesCard";
import { getCurrentFarm } from "@/lib/queries/admin";
import { getCycleDetail } from "@/lib/queries/cycle-detail";
import {
  formatArabicNumber,
  formatCurrency,
  formatWeight,
  pluralizeChicken,
  pluralizeDay,
} from "@/lib/format";

/**
 * A finished cycle, whole (A-45_Cycle_Detail): what it earned and cost, how long
 * it ran and how many birds it lost, the feed it ate day by day, and the spread of
 * weights it came in at.
 *
 * Read-only by design. A closed cycle is a record — everything that could still be
 * done to a cycle lives on the running one's row in the list (A-44).
 */
export default async function AdminCycleDetailPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const [{ cycleId }, farm] = await Promise.all([params, getCurrentFarm()]);
  if (!farm) redirect("/logout");

  const cycle = await getCycleDetail(farm.farmId, cycleId);
  if (!cycle) notFound();

  const { feed } = cycle;

  return (
    <div className="flex flex-col">
      <CycleDetailHeader cycle={cycle} />

      <div className="flex flex-col gap-8 px-screen pb-6 pt-2">
        {/* What the cycle is still owed — the one figure that is not settled. */}
        <p className="flex items-center gap-2 self-start text-lg text-accent-brown">
          <Icon name="debt" size={24} className="shrink-0" aria-hidden />
          {cycle.debt > 0
            ? `متبقي مبلغ ديون ${formatCurrency(cycle.debt)}`
            : "لا توجد ديون خاصة بالدورة"}
        </p>

        <StatSection title="الاحصائيات المالية">
          <div className="flex flex-col gap-3">
            {/* Right→left: income · expenses · profit. */}
            <div className="grid grid-cols-3 gap-2">
              <CycleStatCard
                icon="income"
                label="اجمالي الدخل"
                value={formatArabicNumber(cycle.income)}
                tone="brand"
              />
              <CycleExpensesCard
                total={cycle.expensesTotal}
                expenses={cycle.expenses}
              />
              <CycleStatCard
                icon="cash"
                label="صافي الربح"
                value={formatArabicNumber(cycle.netProfit)}
                // Red when the cycle ended under water — same rule as the list.
                tone={cycle.netProfit < 0 ? "danger" : "brand"}
              />
            </div>

            <CycleStatCard
              icon="weight"
              label="متوسط اوزان الدورة"
              value={formatWeight(cycle.averageWeight)}
              tone="brand"
            />
          </div>
        </StatSection>

        {/* The flock: orders · mortality · how long it ran (right→left). */}
        <div className="grid grid-cols-3 gap-2">
          <CycleStatCard
            icon="ordersNew"
            label="عدد الطلبات"
            value={formatArabicNumber(cycle.orderCount)}
            tone="brand"
          />
          <CycleStatCard
            icon="mortality"
            label="عدد النافق"
            value={pluralizeChicken(cycle.mortalityCount)}
            tone="danger"
          />
          <CycleStatCard
            icon="calendar"
            label="مدة الدورة"
            value={pluralizeDay(cycle.durationDays)}
            tone="brand"
          />
        </div>

        <StatSection title="تتبع استهلاك العلف">
          <div className="flex flex-col gap-6">
            <FeedGrid totalDays={feed.totalDays} withdrawals={feed.withdrawals} />

            {/* No «المتوفر» here: what is left in the store stops meaning
                anything once the cycle is over. */}
            <div className="grid grid-cols-2 gap-3">
              <StatItem
                label="العلف المطلوب"
                value={`${formatArabicNumber(Math.round(feed.requiredBadi))} / ${formatArabicNumber(Math.round(feed.requiredNami))}`}
              />
              <StatItem
                label="العلف المسحوب"
                value={formatArabicNumber(feed.withdrawn)}
                valueClassName="text-accent-tan"
              />
            </div>
          </div>
        </StatSection>

        <StatSection title="توزيع الاوزان">
          <WeightDistribution bands={cycle.weights} />
        </StatSection>
      </div>
    </div>
  );
}
