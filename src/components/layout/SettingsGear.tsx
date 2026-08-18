import Link from "next/link";
import { Icon } from "@/components/ui";

/**
 * The gear that opens admin settings (A-70). It sits alone at the top of every
 * admin home face, on the inline-end (the left in RTL), so it lives here rather
 * than being re-declared on each screen. Sized ≥44px for the touch-target rule.
 */
export function SettingsGear({ size = 34 }: { size?: number }) {
  return (
    <Link
      href="/admin/settings"
      aria-label="الإعدادات"
      className="flex size-11 items-center justify-center self-end text-foreground"
    >
      <Icon name="settings" size={size} />
    </Link>
  );
}
