import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui";
import { EmptyCyclesIllustration } from "@/components/admin/EmptyCyclesIllustration";
import { CreateCycleLauncher } from "@/components/admin/CreateCycleLauncher";
import { getCurrentFarm } from "@/lib/queries/admin";
import { hasActiveCycle } from "@/lib/queries/cycles";

/**
 * Admin home. With no active cycle it shows the first-time empty state
 * (A-10_Home_NoCycle_FirstTime): a welcome, the empty-archive illustration, and
 * the call to start the first cycle. Once a cycle is running it hands off to the
 * running-cycle dashboard (A-11+), which is a later screen — a placeholder for
 * now so the routing is real.
 */
export default async function AdminHomePage() {
  const farm = await getCurrentFarm();
  if (!farm) redirect("/login");

  const cycleRunning = await hasActiveCycle(farm.farmId);
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

      {cycleRunning ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-10 text-center">
          <p className="text-h5 font-bold text-heading">فيه دورة شغالة دلوقتي</p>
          <p className="text-muted">لوحة الدورة قيد الإنشاء…</p>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-10 pb-2 ">
            <EmptyCyclesIllustration size={188} />
            <p className="max-w-[345px] text-h6 font-normal leading-[1.45] text-foreground">
              من هنا ها تقدر تدير دوراتك كلها<br /> بسهولة و امان من اول تسجيل الكتاكيت
              لحد البيع و الحسابات
            </p>
          </div>

          <div className="mb-4">
            <CreateCycleLauncher label="ابدأ سجل اول دورة" />
          </div>
        </>
      )}
    </div>
  );
}
