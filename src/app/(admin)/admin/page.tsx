import { redirect } from "next/navigation";
import { FirstTimeWelcome } from "@/components/admin/home/idle/FirstTimeWelcome";
import { IdleDashboard } from "@/components/admin/home/idle/IdleDashboard";
import { RaisingDashboard } from "@/components/admin/home/raising/RaisingDashboard";
import { SellingDashboard } from "@/components/admin/home/selling/SellingDashboard";
import { getCurrentFarm } from "@/lib/queries/admin";
import {
  getActiveCycleDashboard,
  getCycleEstimateBasis,
  listCycles,
} from "@/lib/queries/cycles";
import { getCycleExpenses } from "@/lib/queries/expenses";
import { listFarmCustomers } from "@/lib/queries/customers";
import { getFarmSettings } from "@/lib/queries/settings";
import { getSellingStats } from "@/lib/queries/selling";

/**
 * Admin home. Its face is whatever the farm is doing right now:
 *   • raising  → the raising dashboard (A-11);
 *   • selling  → the selling dashboard (A-20);
 *   • between cycles → the idle home (A-21), the last cycle's outcome and the
 *     comparison against the ones before it;
 *   • no cycle ever → the first-time welcome (A-10).
 */
export default async function AdminHomePage() {
  const farm = await getCurrentFarm();
  if (!farm) redirect("/logout");

  const dashboard = await getActiveCycleDashboard(farm.farmId);

  if (dashboard?.phase === "raising") {
    // The itemised spend travels with the page so the «مصاريف الدورة» tile opens
    // instantly (A-47) — it is a few dozen rows, and this screen is used with
    // both hands busy.
    const expenses = await getCycleExpenses(dashboard.cycleId);
    return <RaisingDashboard data={dashboard} expenses={expenses} />;
  }

  if (dashboard?.phase === "selling") {
    // «اضافة طلب» lives in this header too (D-51), so the customer list and the
    // order settings travel with the page the same way they do on A-50.
    const [stats, expenses, customers, settings] = await Promise.all([
      getSellingStats(farm.farmId, dashboard.cycleId, {
        chickCount: dashboard.chickCount,
        mortalityCount: dashboard.mortalityCount,
      }),
      getCycleExpenses(dashboard.cycleId),
      listFarmCustomers(farm.farmId),
      getFarmSettings(farm.farmId),
    ]);
    return (
      <SellingDashboard
        cycle={dashboard}
        stats={stats}
        expenses={expenses}
        customers={customers}
        weights={settings.availableWeights}
        defaultCleaning={settings.defaultCleaning}
        cleaningPrice={settings.cleaningPrice}
      />
    );
  }

  // Nothing is running. Both remaining faces need the create-cycle forecast, and
  // the idle one needs the history it is a summary of.
  const [cycles, basis] = await Promise.all([
    listCycles(farm.farmId),
    getCycleEstimateBasis(farm.farmId),
  ]);

  if (cycles.length === 0) {
    return <FirstTimeWelcome ownerName={farm.ownerName} basis={basis} />;
  }

  // Debt is the farm's, not the last cycle's: with nothing running, the question
  // is who still owes him — clamped per cycle already, so this only adds up.
  const farmDebt = cycles.reduce((total, cycle) => total + cycle.debt, 0);
  // «اخر المصاريف» belongs to the cycle that just closed, so its breakdown does too.
  const expenses = await getCycleExpenses(cycles[0].cycleId);

  return (
    <IdleDashboard
      cycles={cycles}
      farmDebt={farmDebt}
      expenses={expenses}
      basis={basis}
    />
  );
}
