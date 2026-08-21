"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "./NavIcon";
import { formatArabicNumber } from "@/lib/format";
import { isActivePath } from "@/lib/utils";

/**
 * The customer bottom navigation (Component 62 in the design). Shared across all
 * customer screens via (customer)/layout, so it stays put while pages change.
 * The "تتبع الطلب" tab carries a badge with the count of in-progress orders.
 *
 * Order matters: in RTL the first child sits on the right, so الرئيسية renders
 * first to land on the right edge, matching the design. Every tab is the same
 * color — the active one differs only by its filled icon (see NavIcon).
 */
type NavIconName = "home" | "order" | "track";

interface NavEntry {
  href: string;
  label: string;
  icon: NavIconName;
  badge?: number;
  exact?: boolean; // home matches exactly so it doesn't stay lit on sub-pages
}

export function BottomNav({ activeOrders = 0 }: { activeOrders?: number }) {
  const pathname = usePathname();

  const items: NavEntry[] = [
    { href: "/", label: "الرئيسية", icon: "home", exact: true },
    { href: "/order", label: "اطلب الان", icon: "order" },
    { href: "/tracking", label: "تتبع الطلب", icon: "track", badge: activeOrders },
  ];

  return (
    <nav
      className="fixed inset-x-0 z-40 mx-auto flex max-w-[430px] items-center justify-center gap-8 border-t-2 border-border bg-white px-screen py-2 text-primary-foreground"
      // The bar sits ON TOP of the phone's gesture strip instead of swallowing
      // it: `bottom` lifts it clear, and the strip underneath is left to the
      // shell's own `bg-background` (#fbfdfc). Padding it instead made the white
      // bar run all the way down to the edge of the screen — visible only in the
      // installed app, since in a browser that strip belongs to the browser
      // (Khaled, 2026-08-21). What the bar occupies in total is unchanged, so
      // <main>'s bottom padding still clears it.
      style={{ bottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1"
          >
            <span className="relative">
              <NavIcon name={item.icon} active={active} size={28} />
              {item.badge ? (
                <span className="absolute -start-2 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-primary-hover bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {formatArabicNumber(item.badge)}
                </span>
              ) : null}
            </span>
            <span className="text-sm font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
