import { redirect } from "next/navigation";
import { CycleRow } from "@/components/admin/cycles/CycleRow";
import { CyclesEmptyState } from "@/components/admin/cycles/CyclesEmptyState";
import { CyclesToolbar } from "@/components/admin/cycles/CyclesToolbar";
import { RunningCycleControls } from "@/components/admin/cycles/RunningCycleControls";
import { getCurrentFarm } from "@/lib/queries/admin";
import {
  getActiveCycleDashboard,
  getCycleEstimateBasis,
  listCycles,
  type CycleListItem,
} from "@/lib/queries/cycles";
import { countOpenCycleOrders } from "@/lib/queries/orders";

/**
 * Where a row leads depends on what the cycle is doing:
 *   • finished → its own page (A-45), the only place its history lives;
 *   • التربية  → the home dashboard, which *is* the running cycle's page;
 *   • البيع    → nowhere. Everything that cycle can be asked is on the row
 *                itself (A-44), so there is nothing left to walk into.
 */
function rowHref(cycle: CycleListItem): string | undefined {
  if (cycle.phase === "ended") return `/admin/cycles/${cycle.cycleId}`;
  return cycle.phase === "raising" ? "/admin" : undefined;
}

/**
 * Admin cycles (A-40 → A-44) — the farm's whole history, newest first. With no
 * cycle ever registered it shows the empty state (A-40); otherwise every cycle
 * gets a row, and the running one sits on top carrying what can still be done
 * to it.
 */
export default async function AdminCyclesPage() {
  const farm = await getCurrentFarm();
  if (!farm) redirect("/logout");

  const cycles = await listCycles(farm.farmId);
  if (cycles.length === 0) return <CyclesEmptyState />;

  const running = cycles.find((cycle) => cycle.phase !== "ended");

  const [dashboard, openOrders, basis] = await Promise.all([
    // The running cycle's feed: «تسجيل مصاريف» and the feed tiles on its row read
    // the same store the dashboard does.
    running ? getActiveCycleDashboard(farm.farmId) : null,
    // Ending the cycle is refused while any order is still open (D-36) — the
    // dialog says how many before he commits.
    running ? countOpenCycleOrders(running.cycleId) : 0,
    // What the last cycle really cost — the create-cycle sheet forecasts the
    // next one from it (T-46). Only read when that sheet can actually open.
    running ? undefined : getCycleEstimateBasis(farm.farmId),
  ]);

  return (
    <div className="flex flex-col gap-4 pt-4">
      {!running && <CyclesToolbar basis={basis} />}

      <ul className="flex flex-col gap-2">
        {cycles.map((cycle) => (
          <li key={cycle.cycleId}>
            <CycleRow cycle={cycle} href={rowHref(cycle)}>
              {cycle.cycleId === running?.cycleId && dashboard && (
                <RunningCycleControls
                  phase={cycle.phase}
                  feed={dashboard.feed}
                  openOrders={openOrders}
                />
              )}
            </CycleRow>
          </li>
        ))}
      </ul>
    </div>
  );
}
