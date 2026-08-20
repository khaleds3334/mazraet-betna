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
    return <RaisingDashboard data={dashboard} />;
  }

  if (dashboard?.phase === "selling") {
    const stats = await getSellingStats(farm.farmId, dashboard.cycleId, {
      chickCount: dashboard.chickCount,
      mortalityCount: dashboard.mortalityCount,
    });
    return <SellingDashboard cycle={dashboard} stats={stats} />;
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

  return <IdleDashboard cycles={cycles} farmDebt={farmDebt} basis={basis} />;
}
