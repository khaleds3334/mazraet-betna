import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui";
import { EmptyCyclesIllustration } from "@/components/admin/EmptyCyclesIllustration";
import { CreateCycleLauncher } from "@/components/admin/CreateCycleLauncher";
import { RaisingDashboard } from "@/components/admin/RaisingDashboard";
import { getCurrentFarm } from "@/lib/queries/admin";
import { getActiveCycleDashboard } from "@/lib/queries/cycles";

/**
 * Admin home. Its face depends on the active cycle:
 *   • none      → first-time empty state (A-10): welcome + start-first-cycle CTA.
 *   • raising   → the raising dashboard (A-11).
 *   • selling / ended → their own dashboards (A-20 / A-21) — later screens, a
 *     placeholder for now so the phase routing is real.
 */
export default async function AdminHomePage() {
  const farm = await getCurrentFarm();
  if (!farm) redirect("/login");

  const dashboard = await getActiveCycleDashboard(farm.farmId);

  if (dashboard?.phase === "raising") {
    return <RaisingDashboard data={dashboard} />;
  }

  if (dashboard) {
    // Selling (A-20) / ended (A-21) dashboards are later screens.
    const title = dashboard.phase === "selling" ? "البيع مفتوح" : "الدورة انتهت";
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-screen pb-10 text-center">
        <p className="text-h5 font-bold text-heading">{title}</p>
        <p className="text-muted">لوحة الدورة قيد الإنشاء…</p>
      </div>
    );
  }

  // No active cycle — the first-time empty state (A-10).
  const greeting = farm.ownerName ? `أهلا بيك ${farm.ownerName} 👋` : "أهلا بيك 👋";
  return (
    <div className="flex flex-1 flex-col px-screen pt-4">
      {/* Settings gear — top-left in the design (the inline end in RTL). */}
      <header className="flex justify-end">
        <Link
          href="/admin/settings"
          aria-label="الإعدادات"
          className="flex size-11 items-center justify-center text-foreground"
        >
          <Icon name="settings" size={34} />
        </Link>
      </header>

      <h1 className="mt-6 text-center text-h6 font-bold text-primary-foreground">
        {greeting}
      </h1>

      <div className="flex flex-1 flex-col items-center justify-center gap-10 pb-2">
        <EmptyCyclesIllustration size={188} />
        <p className="max-w-[345px] text-h6 font-normal leading-[1.45] text-foreground">
          من هنا ها تقدر تدير دوراتك كلها<br /> بسهولة و امان من اول تسجيل الكتاكيت
          لحد البيع و الحسابات
        </p>
      </div>

      <div className="mb-4">
        <CreateCycleLauncher label="ابدأ سجل اول دورة" />
      </div>
    </div>
  );
}
