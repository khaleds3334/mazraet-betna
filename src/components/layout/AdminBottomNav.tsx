"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNavIcon, type AdminNavIconName } from "./AdminNavIcon";
import { CountBadge } from "@/components/ui";
import { isActivePath } from "@/lib/utils";

/**
 * The admin bottom navigation (Navigation Container in the A-10 design). Shared
 * across all admin screens via (admin)/layout, so it stays put while pages
 * change. Four sections; Settings is reached from the gear in the header, not
 * here.
 *
 * Order matters: in RTL the first child sits on the right, so الرئيسية renders
 * first to land on the right edge, matching the design. The active tab differs
 * by COLOR only — dark green icon + label vs muted (see AdminNavIcon).
 */
interface NavEntry {
  href: string;
  label: string;
  icon: AdminNavIconName;
  exact?: boolean; // home matches exactly so it doesn't stay lit on sub-pages
}

const ITEMS: NavEntry[] = [
  { href: "/admin", label: "الرئيسية", icon: "home", exact: true },
  { href: "/admin/orders", label: "الطلبات", icon: "orders" },
  { href: "/admin/customers", label: "العملاء", icon: "customers" },
  { href: "/admin/cycles", label: "الدورات", icon: "cycles" },
];

/**
 * Screens that replace the tab bar with their own bottom control. Settings ends
 * in «حفظ الاعدادات», which has to sit where the thumb already is — two fixed
 * bars stacked would push it up into the page (Khaled, 2026-08-22).
 */
const NO_NAV = ["/admin/settings"];

export function AdminBottomNav({
  pendingOrders = 0,
}: {
  /** «الجديدة» — orders waiting on him. Rides the corner of «الطلبات». */
  pendingOrders?: number;
}) {
  const pathname = usePathname();
  if (NO_NAV.includes(pathname)) return null;

  return (
    <nav
      className="fixed inset-x-0 z-40 mx-auto flex max-w-[430px] items-center justify-between border-t-2 border-border bg-white px-screen py-2"
      // The bar sits ON TOP of the phone's gesture strip instead of swallowing
      // it: `bottom` lifts it clear, and the strip underneath is left to the
      // shell's own `bg-background` (#fbfdfc). Padding it instead made the white
      // bar run all the way down to the edge of the screen — visible only in the
      // installed app, since in a browser that strip belongs to the browser
      // (Khaled, 2026-08-21). What the bar occupies in total is unchanged, so
      // <main>'s bottom padding still clears it.
      style={{ bottom: "env(safe-area-inset-bottom)" }}
    >
      {ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            // Every link in the app replaces rather than pushes: the back gesture
            // means "home, then out" now, not "one screen back" (`BackGuard`).
            replace
            aria-current={active ? "page" : undefined}
            className={
              "flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 " +
              (active ? "text-primary-foreground" : "text-brand-muted")
            }
          >
            {/* Wrapped so the disc pins to the glyph rather than to the 44px
                tap target around it — the same corner rule the customer's bar
                and the notification bell follow. */}
            <span className="relative">
              <AdminNavIcon name={item.icon} size={28} />
              {item.href === "/admin/orders" && (
                <CountBadge count={pendingOrders} />
              )}
            </span>
            <span className="text-sm font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
