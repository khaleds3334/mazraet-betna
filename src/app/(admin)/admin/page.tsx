import { redirect } from "next/navigation";
import { EmptyCyclesIllustration } from "@/components/admin/cycles/EmptyCyclesIllustration";
import { CreateCycleLauncher } from "@/components/admin/cycles/CreateCycleLauncher";
import { RaisingDashboard } from "@/components/admin/home/raising/RaisingDashboard";
import { SellingDashboard } from "@/components/admin/home/selling/SellingDashboard";
import { SettingsGear } from "@/components/layout/SettingsGear";
import { getCurrentFarm } from "@/lib/queries/admin";
import { getActiveCycleDashboard } from "@/lib/queries/cycles";
import { getSellingStats } from "@/lib/queries/selling";

/**
 * Admin home. Its face depends on the active cycle:
 *   • none      → first-time empty state (A-10): welcome + start-first-cycle CTA.
 *   • raising   → the raising dashboard (A-11).
 *   • selling   → the selling dashboard (A-20).
 *   • ended     → its own dashboard (A-21) — a later screen, a placeholder for
 *     now so the phase routing is real.
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

  if (dashboard) {
    // The end-of-cycle dashboard (A-21) is a later screen.
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-screen pb-10 text-center">
        <p className="text-h5 font-bold text-heading">الدورة انتهت</p>
        <p className="text-muted">لوحة الدورة قيد الإنشاء…</p>
      </div>
    );
  }

  // No active cycle — the first-time empty state (A-10).
  const greeting = farm.ownerName
    ? `أهلا بيك ${farm.ownerName} 👋`
    : "أهلا بيك 👋";
  return (
    <div className="flex flex-1 flex-col px-screen pt-4">
      <header className="flex flex-col">
        <SettingsGear />
      </header>

      <h1 className="mt-6 text-center text-h6 font-bold text-primary-foreground">
        {greeting}
      </h1>

      <div className="flex flex-1 flex-col items-center justify-center gap-10 pb-2">
        <EmptyCyclesIllustration size={188} />
        <p className="max-w-[345px] text-h6 font-normal leading-[1.45] text-foreground">
          من هنا ها تقدر تدير دوراتك كلها
          <br /> بسهولة و امان من اول تسجيل الكتاكيت لحد البيع و الحسابات
        </p>
      </div>

      <div className="mb-4">
        <CreateCycleLauncher label="ابدأ سجل اول دورة" />
      </div>
    </div>
  );
}
