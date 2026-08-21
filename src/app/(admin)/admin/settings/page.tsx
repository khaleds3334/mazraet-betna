import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/settings/SettingsForm";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { PageHeader } from "@/components/ui";
import { getCurrentFarm } from "@/lib/queries/admin";
import { getFarmSettings } from "@/lib/queries/settings";
import { getSaleControlState } from "@/lib/queries/settings";

/**
 * Admin settings (A-70, FR-5 / FR-11). The kilo price, the cleaning fee, the
 * weights a customer may pick, when the sale starts or ends — and the switch
 * that stops orders without ending the cycle.
 *
 * Sign-out sits under «حفظ الاعدادات»: the design draws no such row here, and
 * the position is Khaled's (2026-08-19).
 */
export default async function AdminSettingsPage() {
  const farm = await getCurrentFarm();
  if (!farm) redirect("/logout");

  const [settings, sale] = await Promise.all([
    getFarmSettings(farm.farmId),
    getSaleControlState(farm.farmId),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Held at the top of the scroll rather than riding it away: this screen is
          a list of unrelated settings, and the title is the only thing saying
          which screen you are on. Its own background and full-bleed padding are
          what the content scrolls *under* — without them the page would show
          through the margins beside it. */}
      <PageHeader
        title="اعدادات التطبيق و المزرعة"
        backHref="/admin"
        className="sticky top-0 z-20 bg-background px-screen pb-3 pt-4"
      />

      <SettingsForm
        className="px-screen"
        settings={settings}
        sale={sale}
        farm={farm}
        logout={<LogoutButton />}
      />
    </div>
  );
}
