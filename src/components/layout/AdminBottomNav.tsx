"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNavIcon, type AdminNavIconName } from "./AdminNavIcon";
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

export function AdminBottomNav() {
  const pathname = usePathname();

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
            aria-current={active ? "page" : undefined}
            className={
              "flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 " +
              (active ? "text-primary-foreground" : "text-brand-muted")
            }
          >
            <AdminNavIcon name={item.icon} size={28} />
            <span className="text-sm font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
