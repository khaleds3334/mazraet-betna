import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatItem, Icon } from "@/components/ui";
import { CycleDetailHeader } from "@/components/admin/cycles/detail/CycleDetailHeader";
import { WeightDistribution } from "@/components/admin/cycles/detail/WeightDistribution";
import { CycleStatCard } from "@/components/admin/home/shared/CycleStatCard";
import { StatSection } from "@/components/admin/home/shared/StatSection";
import { FeedGrid } from "@/components/admin/shared/FeedGrid";
import { FeedPhasePair } from "@/components/admin/shared/FeedPhasePair";
import { CycleExpensesCard } from "@/components/admin/shared/expenses/CycleExpensesCard";
import { getCurrentFarm } from "@/lib/queries/admin";
import { getCycleDetail } from "@/lib/queries/cycle-detail";
import { FEED_PHASE_TEXT } from "@/lib/feedColors";
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
        {/* What the cycle is still owed — the one figure that is not settled,
            and the only one here the admin can still act on. It opens the
            customers who owe (Khaled, 2026-08-22); with nothing owed there is
            nowhere to go, so it stays a sentence. */}
        {cycle.debt > 0 ? (
          <Link
            href="/admin/customers?debt=1"
            replace
            className="flex min-h-11 items-center gap-2 self-start text-lg text-accent-brown transition-transform active:scale-[0.99]"
          >
            <Icon name="debt" size={24} className="shrink-0" aria-hidden />
            متبقي مبلغ ديون {formatCurrency(cycle.debt)}
          </Link>
        ) : (
          <p className="flex items-center gap-2 self-start text-lg text-accent-brown">
            <Icon name="debt" size={24} className="shrink-0" aria-hidden />
            لا توجد ديون خاصة بالدورة
          </p>
        )}

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
                anything once the cycle is over.

                Both tiles read بادي / نامي, the same pair the running cycle shows
                (A-11/A-44). «المسحوب» was one lump total, which said what the
                cycle ate but not what it ate *of* — and the grid right above it
                is coloured by feed, so the tile under it had to name the same two
                things the same way (Khaled, 2026-08-22).

                No rounding on «المطلوب» either: bags are bought and opened by
                the half, and this screen printing ٢ / ٦ for the cycle the
                create sheet quoted as ١.٥ / ٥.٥ makes one of the two wrong. */}
            <div className="grid grid-cols-2 gap-3">
              <StatItem
                label="العلف المطلوب"
                value={
                  <FeedPhasePair
                    badi={feed.requiredBadi}
                    nami={feed.requiredNami}
                  />
                }
              />
              <StatItem
                label="العلف المسحوب"
                value={
                  /* Each feed in its own colour (D-48), as on the running cycle
                     — a running total never reddens. */
                  <FeedPhasePair
                    badi={feed.withdrawnBadi}
                    nami={feed.withdrawnNami}
                    badiClassName={FEED_PHASE_TEXT.badi}
                    namiClassName={FEED_PHASE_TEXT.nami}
                  />
                }
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
