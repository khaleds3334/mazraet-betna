import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/ui";
import { getCurrentFarm } from "@/lib/queries/admin";
import { listCycles } from "@/lib/queries/cycles";

/**
 * A finished cycle's own page (A-45 → A-47): its accounting, its weight
 * distribution, and its detailed expenses. The screen itself is a later session;
 * the route is real now so the rows on the list (A-42) lead somewhere rather than
 * to a 404 — which would show English to a user who reads none.
 *
 * It already refuses an id that isn't this farm's, so the placeholder never
 * implies a cycle exists when it doesn't.
 */
export default async function AdminCycleDetailPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const [{ cycleId }, farm] = await Promise.all([params, getCurrentFarm()]);
  if (!farm) notFound();

  const cycle = (await listCycles(farm.farmId)).find(
    (row) => row.cycleId === cycleId,
  );
  if (!cycle) notFound();

  return <ComingSoon title={cycle.name ?? "تفاصيل الدورة"} />;
}
