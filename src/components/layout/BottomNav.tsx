"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "./NavIcon";
import { CountBadge } from "@/components/ui";
import { actionBase, actionPrimary } from "@/components/ui/buttonStyles";
import { cn, isActivePath } from "@/lib/utils";

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

/** Customer screens that hide the bar entirely — see the note in the component. */
const SCREENS_WITHOUT_NAV = ["/history"];

interface NavEntry {
  href: string;
  label: string;
  icon: NavIconName;
  badge?: number;
  exact?: boolean; // home matches exactly so it doesn't stay lit on sub-pages
}

export function BottomNav({ activeOrders = 0 }: { activeOrders?: number }) {
  const pathname = usePathname();

  // «الطلبات السابقة» is walked into, not tabbed to: it has a back button and
  // no bar at all (C-50). The page gives back the room <main> reserves for the
  // bar with `-mb-nav`, so the two have to agree on this list.
  if (SCREENS_WITHOUT_NAV.some((href) => isActivePath(pathname, href))) {
    return null;
  }

  // The tracking section gets a taller bar (see the button below). Matched on
  // the section, not the exact path, so it stays for /tracking/[orderId] too.
  const onTracking = isActivePath(pathname, "/tracking");

  const items: NavEntry[] = [
    { href: "/", label: "الرئيسية", icon: "home", exact: true },
    { href: "/order", label: "اطلب الان", icon: "order" },
    {
      href: "/tracking",
      label: "تتبع الطلب",
      icon: "track",
      badge: activeOrders,
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 z-40 mx-auto flex max-w-[430px] flex-col border-t-2 border-border bg-white px-screen py-2 text-primary-foreground"
      // The bar sits ON TOP of the phone's gesture strip instead of swallowing
      // it: `bottom` lifts it clear, and the strip underneath is left to the
      // shell's own `bg-background` (#fbfdfc). Padding it instead made the white
      // bar run all the way down to the edge of the screen — visible only in the
      // installed app, since in a browser that strip belongs to the browser
      // (Khaled, 2026-08-21). What the bar occupies in total is unchanged, so
      // <main>'s bottom padding still clears it.
      style={{ bottom: "env(safe-area-inset-bottom)" }}
    >
      {/* On the tracking section the bar carries «الطلبات السابقة» above the
          tabs — Component 63 in the design, used on every tracking state, not
          just the empty one. It lives here rather than on the page because the
          design draws it inside the bar's surface, under the same top border. */}
      {onTracking && (
        <Link
          href="/history"
          replace
          className={cn(actionBase, actionPrimary, "mb-4")}
        >
          الطلبات السابقة
        </Link>
      )}

      <div className="flex items-center justify-center gap-8">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              // Replaces rather than pushes — see the note in `BackGuard`.
              replace
              aria-current={active ? "page" : undefined}
              className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1"
            >
              <span className="relative">
                <NavIcon name={item.icon} active={active} size={28} />
                <CountBadge count={item.badge ?? 0} />
              </span>
              <span className="text-sm font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
