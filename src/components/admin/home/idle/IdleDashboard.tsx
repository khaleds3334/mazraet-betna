import { Badge } from "@/components/ui";
import { SettingsGear } from "@/components/layout/SettingsGear";
import { CreateCycleLauncher } from "@/components/admin/cycles/CreateCycleLauncher";
import { formatArabicNumber, pluralizeDay } from "@/lib/format";
import type { CycleEstimateBasis } from "@/lib/calculations/cycle";
import type { CycleListItem } from "@/lib/queries/cycles";
import type { CycleExpenses } from "@/lib/queries/expenses";
import { CycleExpensesCard } from "@/components/admin/shared/expenses/CycleExpensesCard";
import { CycleStatCard } from "../shared/CycleStatCard";
import { CycleComparisonChart } from "./CycleComparisonChart";

/** How many cycles the comparison chart looks back over. */
const CHART_CYCLES = 3;

/**
 * When the last cycle ended, in words. The design writes «منذ ١٢ يوم», which
 * only reads well from two days back — «منذ ٠ يوم» is not something anyone says.
 */
function endedWhen(days: number): string {
  if (days === 0) return "النهاردة";
  if (days === 1) return "امبارح";
  return `منذ ${pluralizeDay(days)}`;
}

/**
 * Admin home between cycles (A-21_Home_CycleEnded): the farm has history but
 * nothing is running. It reports where the last cycle landed, what the farm is
 * still owed, how the recent cycles compare, and offers the only thing worth
 * doing from here — starting the next one.
 *
 * Profit and expenses are **the last cycle's**; the debt is **the whole farm's**
 * — with no cycle running, what he wants to know is who still owes him, not
 * which cycle it came from (Khaled, 2026-08-20).
 *
 * `cycles` arrives newest-first; the chart wants oldest-first so the groups read
 * forward in time in RTL.
 */
export function IdleDashboard({
  cycles,
  farmDebt,
  expenses,
  basis,
}: {
  /** Every cycle the farm has run, newest first. Never empty — A-10 covers that. */
  cycles: CycleListItem[];
  /** Everything customers still owe, across every cycle (FR-20). */
  farmDebt: number;
  /** The last cycle's spending, itemised — behind its tile (A-47). */
  expenses: CycleExpenses;
  basis: CycleEstimateBasis;
}) {
  const last = cycles[0];

  const history = cycles.slice(0, CHART_CYCLES).reverse();

  return (
    <div className="flex flex-1 flex-col gap-6 px-screen pb-6 pt-2">
      <header className="flex flex-col">
        <SettingsGear />
        <Badge tone="accent" className="self-start">
          لا توجد دورة نشطة حاليا
        </Badge>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 text-h6 font-bold text-primary-foreground">
        <span>تم الانتهاء من اخر دورة</span>
        {last.daysSinceEnd !== null && <span>{endedWhen(last.daysSinceEnd)}</span>}
      </div>

      {/* The last cycle's outcome, then the farm's standing. Right→left. */}
      <div className="grid grid-cols-3 gap-2">
        <CycleStatCard
          icon="income"
          label="ربح الدورة"
          value={formatArabicNumber(last.netProfit)}
          /* Red when the cycle ended under water — see `CycleRow`. */
          tone={last.netProfit < 0 ? "danger" : "brand"}
        />
        <CycleExpensesCard
          total={last.expensesTotal}
          expenses={expenses}
          label="اخر المصاريف"
        />
        <CycleStatCard
          icon="debt"
          label="الديون"
          value={formatArabicNumber(farmDebt)}
          tone="tan"
          href="/admin/customers?debt=1"
        />
      </div>

      {/* One cycle is not a comparison: measured against itself every bar would
          stand full height and read as "everything was at its best". */}
      {history.length > 1 && <CycleComparisonChart cycles={history} />}

      <div className="mt-auto pt-2">
        <CreateCycleLauncher label="انشاء دورة جديدة" basis={basis} />
      </div>
    </div>
  );
}
