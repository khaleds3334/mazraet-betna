import { ComingSoon } from "@/components/ui";
import { LogoutButton } from "@/components/shared/LogoutButton";

/**
 * Admin settings (A-70). The screen itself lands in Phase 5; for now it carries
 * only the sign-out, which the design does not draw here — A-70 has no such row
 * (Khaled, 2026-08-19: same row as the customer sidebar, at the bottom of the
 * page). When the real settings arrive it keeps this position, under «حفظ
 * الاعدادات».
 */
export default function AdminSettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <ComingSoon title="الإعدادات" />

      <div className="px-screen pb-4">
        <LogoutButton />
      </div>
    </div>
  );
}
