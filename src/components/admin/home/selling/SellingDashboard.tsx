import { CycleExpensesCard } from "@/components/admin/shared/expenses/CycleExpensesCard";
import type { CycleDashboard } from "@/lib/queries/cycles";
import type { CycleExpenses } from "@/lib/queries/expenses";
import type { SellingStats } from "@/lib/queries/selling";
import { formatArabicNumber, formatWeight } from "@/lib/format";
import { CycleStatCard } from "../shared/CycleStatCard";
import { StatSection } from "../shared/StatSection";
import { SellingHeader } from "./SellingHeader";
import { RevealableStatCard } from "./RevealableStatCard";

/**
 * Admin home while the sale is open (A-20_Home_SaleOpen): the header badges
 * (price · sale state · flock age) over three sections of stat tiles — the
 * flock, the money, and the orders. Pure view; every figure arrives computed on
 * `cycle` (the shared cycle read) and `stats` (the selling-only aggregates).
 *
 * Tile order inside each row is right→left, the way it reads in RTL.
 */
export function SellingDashboard({
  cycle,
  stats,
  expenses,
}: {
  cycle: CycleDashboard;
  stats: SellingStats;
  expenses: CycleExpenses;
}) {
  const { flock, money, orders } = stats;

  return (
    <div className="flex flex-1 flex-col gap-6 px-screen pb-6 pt-4">
      <SellingHeader ageDays={cycle.ageDays} salePrice={cycle.salePrice} />

      {/* `my-auto` centres the three sections in the leftover height (the design
          centres them) yet collapses to 0 and scrolls on short screens. */}
      <div className="my-auto flex flex-col gap-6">
        {/* The flock, split three ways. Flat tiles here — the design raises only
          the money and order rows. */}
        <StatSection title="احصائيات الفراخ">
          <div className="grid grid-cols-3 gap-2">
            <CycleStatCard
              icon="chickensAvailable"
              label="الفراخ المتوفرة"
              value={formatArabicNumber(flock.available)}
              tone="brand"
              raised={false}
            />
            <CycleStatCard
              icon="chickensSold"
              label="تم بيعها"
              value={formatArabicNumber(flock.sold)}
              tone="olive"
              raised={false}
            />
            <CycleStatCard
              icon="chickensRequested"
              label="المطلوبة"
              value={formatArabicNumber(flock.requested)}
              tone="tan"
              raised={false}
            />
          </div>
        </StatSection>

        {/* Money. Row 2 pairs the wallet with the wide average-weight tile. */}
        <StatSection title="الاحصائيات المالية">
          <div className="grid grid-cols-3 gap-x-2 gap-y-2">
            <RevealableStatCard
              icon="income"
              label="اجمالي الدخل"
              value={formatArabicNumber(money.income)}
              tone="brand"
            />
            <CycleExpensesCard
              total={cycle.expensesTotal}
              expenses={expenses}
            />
            <CycleStatCard
              icon="debt"
              label="الديون"
              value={formatArabicNumber(money.debt)}
              tone="tan"
            />
            <CycleStatCard
              icon="cash"
              label="في المحفظة"
              value={formatArabicNumber(money.collected)}
              tone="brand"
            />
            <CycleStatCard
              icon="weight"
              label="متوسط اوزان الدورة"
              value={formatWeight(money.averageWeight)}
              tone="brand"
              className="col-span-2"
            />
          </div>
        </StatSection>

        {/* Orders, grouped the way the admin's order tabs group them (FR-12). */}
        <StatSection title="الطلبات">
          <div className="grid grid-cols-3 gap-2">
            <CycleStatCard
              icon="ordersNew"
              label="الطلبات الجديدة"
              value={formatArabicNumber(orders.new)}
              tone="brand"
            />
            <CycleStatCard
              icon="ordersProcessing"
              label="قيد التشغيل"
              value={formatArabicNumber(orders.active)}
              tone="tan"
            />
            <CycleStatCard
              icon="delivered"
              label="المكتملة"
              value={formatArabicNumber(orders.done)}
              tone="olive"
            />
          </div>
        </StatSection>
      </div>
    </div>
  );
}
