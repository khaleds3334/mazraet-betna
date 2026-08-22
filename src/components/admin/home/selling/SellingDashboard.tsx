import { CycleExpensesCard } from "@/components/admin/shared/expenses/CycleExpensesCard";
import type { CycleDashboard } from "@/lib/queries/cycles";
import type { CycleExpenses } from "@/lib/queries/expenses";
import type { SellingStats } from "@/lib/queries/selling";
import { formatArabicNumber, formatWeight } from "@/lib/format";
import { CycleStatCard } from "../shared/CycleStatCard";
import { StatSection } from "../shared/StatSection";
import { SellingHeader } from "./SellingHeader";
import { RevealableStatCard } from "./RevealableStatCard";
import { OrderStatLink } from "./OrderStatLink";
import type { CustomerOption } from "@/lib/queries/customers";

/**
 * Admin home while the sale is open (A-20_Home_SaleOpen): the header badges
 * (price · sale state · flock age) over three sections of stat tiles — the
 * flock, the money, and the orders. Pure view; every figure arrives computed on
 * `cycle` (the shared cycle read) and `stats` (the selling-only aggregates).
 *
 * Tile order inside each row is right→left, the way it reads in RTL.
 *
 * The header is `sticky`: «اضافة طلب», the kilo price and the sale state are the
 * things this screen is for, and scrolling to read the figures should not take
 * them away. The page's side padding moves onto the two blocks so the pinned one
 * can paint the full width — otherwise the figures would slide past it through
 * the gutters (the same arrangement as `OrdersShell`, T-35).
 */
export function SellingDashboard({
  cycle,
  stats,
  expenses,
  customers,
  weights,
  defaultCleaning,
  cleaningPrice,
}: {
  cycle: CycleDashboard;
  stats: SellingStats;
  expenses: CycleExpenses;
  /** Handed to «اضافة طلب» in the header. */
  customers: CustomerOption[];
  weights: number[];
  defaultCleaning: boolean;
  cleaningPrice: number;
}) {
  const { flock, money, orders } = stats;

  return (
    <div className="flex flex-1 flex-col gap-3 pb-6">
      <div className="sticky top-0 z-10 bg-background px-screen pt-3 pb-2">
        <SellingHeader
          ageDays={cycle.ageDays}
          salePrice={cycle.salePrice}
          customers={customers}
          weights={weights}
          defaultCleaning={defaultCleaning}
          available={flock.available}
          saleOpen={cycle.saleOpen}
          soldOut={cycle.saleAutoClosed}
          cleaningPrice={cleaningPrice}
        />
      </div>

      {/* `my-auto` centres the three sections in the leftover height (the design
          centres them) yet collapses to 0 and scrolls on short screens. */}
      <div className="my-auto flex flex-col gap-3 px-screen">
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
            {/* No `estimated`: the budget verdict belongs to التربية (D-47). */}
            <CycleExpensesCard
              total={cycle.expensesTotal}
              expenses={expenses}
            />
            <CycleStatCard
              icon="debt"
              label="الديون"
              value={formatArabicNumber(money.debt)}
              tone="tan"
              href="/admin/customers?debt=1"
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

        {/* Orders, grouped the way the admin's order tabs group them (FR-12) —
            and each tile opens its own tab, when it has anything to open. */}
        <StatSection title="الطلبات">
          <div className="grid grid-cols-3 gap-2">
            <OrderStatLink
              tab="new"
              icon="ordersNew"
              label="الطلبات الجديدة"
              count={orders.new}
              tone="brand"
            />
            <OrderStatLink
              tab="active"
              icon="ordersProcessing"
              label="قيد التشغيل"
              count={orders.active}
              tone="tan"
            />
            <OrderStatLink
              tab="done"
              icon="delivered"
              label="المكتملة"
              count={orders.done}
              tone="olive"
            />
          </div>
        </StatSection>
      </div>
    </div>
  );
}
