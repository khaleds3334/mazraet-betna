import { CreateCycleLauncher } from "@/components/admin/cycles/CreateCycleLauncher";
import { EmptyCyclesIllustration } from "@/components/admin/cycles/EmptyCyclesIllustration";
import { SettingsGear } from "@/components/layout/SettingsGear";
import type { CycleEstimateBasis } from "@/lib/calculations/cycle";

/**
 * Admin home the very first time (A-10_Home_NoCycle_FirstTime): a farm with no
 * cycle on record at all. A greeting, what the app is for in one sentence, and
 * the one thing there is to do.
 *
 * This is the only face of the home that never returns — once a cycle exists,
 * the farm lands on a dashboard or, between cycles, on {@link IdleDashboard}.
 */
export function FirstTimeWelcome({
  ownerName,
  basis,
}: {
  ownerName: string | null;
  basis: CycleEstimateBasis;
}) {
  const greeting = ownerName ? `أهلا بيك ${ownerName} 👋` : "أهلا بيك 👋";

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
        <CreateCycleLauncher label="ابدأ سجل اول دورة" basis={basis} />
      </div>
    </div>
  );
}
