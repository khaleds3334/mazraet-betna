import { redirect } from "next/navigation";
import { EmptyCyclesIllustration } from "@/components/admin/cycles/EmptyCyclesIllustration";
import { CreateCycleLauncher } from "@/components/admin/cycles/CreateCycleLauncher";
import { getCurrentFarm } from "@/lib/queries/admin";
import { getCycleEstimateBasis, hasAnyCycle } from "@/lib/queries/cycles";

/**
 * Admin cycles (A-40 → A-47). With no cycle ever registered it shows the empty
 * state (A-40): the archive illustration, a short explainer, and the CTA that
 * opens the create-cycle sheet (A-41) in place. Once any cycle exists it shows
 * the list (A-42) — a placeholder for now so the routing is real.
 */
export default async function AdminCyclesPage() {
  const farm = await getCurrentFarm();
  if (!farm) redirect("/logout");

  const anyCycle = await hasAnyCycle(farm.farmId);
  // What the last cycle really cost — the create-cycle sheet forecasts the next
  // one from it. Only worth reading once there *is* a last cycle.
  const basis = anyCycle
    ? await getCycleEstimateBasis(farm.farmId)
    : undefined;

  if (anyCycle) {
    return (
      <main className="flex flex-1 flex-col px-screen pt-6">
        <h1 className="text-h5 font-bold text-heading">الدورات</h1>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 pb-10 text-center">
          <p className="text-muted">قائمة الدورات قيد الإنشاء…</p>
        </div>
        <div className="mb-4">
          <CreateCycleLauncher basis={basis} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col px-screen pt-4">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <EmptyCyclesIllustration size={188} />
        <div className="flex flex-col gap-2.5">
          <h1 className="text-h4 font-bold text-foreground">
            لا توجد اي دورات مسجلة بعد
          </h1>
          <p className="max-w-[325px] text-base text-muted">
            يمكنك البدء بتسجيل اول دورة للمزرعة لمتابعتها و إدارتها بسهولة
          </p>
        </div>
      </div>

      <div className="mb-4">
        <CreateCycleLauncher label="ابدأ سجل اول دورة" />
      </div>
    </main>
  );
}
