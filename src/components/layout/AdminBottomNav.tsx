"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNavIcon, type AdminNavIconName } from "./AdminNavIcon";

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
}

const ITEMS: NavEntry[] = [
  { href: "/admin", label: "الرئيسية", icon: "home" },
  { href: "/admin/orders", label: "الطلبات", icon: "orders" },
  { href: "/admin/customers", label: "العملاء", icon: "customers" },
  { href: "/admin/cycles", label: "الدورات", icon: "cycles" },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[430px] items-center justify-between border-t-2 border-border bg-white px-screen pt-2"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
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
