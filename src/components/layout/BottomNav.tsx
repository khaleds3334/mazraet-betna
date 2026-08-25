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

/**
 * Customer screens walked into rather than tabbed to: a back button at the top
 * and no bar at all — «الطلبات السابقة», reached from the tracking bar, and
 * «الرسائل و الاشعارات», reached from the bell. `/tracking` itself keeps its bar;
 * only one order's page below it drops it, which is why that one is matched as a
 * sub-route and not through `isActivePath`.
 */
const SCREENS_WITHOUT_NAV = ["/history", "/notifications"];
const ORDER_DETAIL = /^\/tracking\/[^/]+$/;

/**
 * Where a screen can hang something inside the bar, above the tabs.
 *
 * The order screen's confirm bar goes here (Khaled, 2026-08-25): he asked for
 * the two to read as one piece, and one piece is what this is — the same white
 * surface under the same single top border, growing taller when the confirm
 * content unfolds into it. Drawn as its own floating panel it was two surfaces
 * with two borders and a seam between them, no matter how close they sat.
 *
 * It is a portal and not a prop because the bar lives in the layout while the
 * order state lives in the page below it — nothing can be handed upwards.
 *
 * Same reasoning as «الطلبات السابقة» just below, which is drawn inside the
 * bar's surface for the same reason; that one is hard-coded here because it
 * needs nothing from the page.
 */
export const NAV_SLOT_ID = "nav-slot";

/**
 * The bar itself, for the one thing that has to know where its top edge is: a
 * panel deciding whether to drop below the field that opened it or rise above
 * it (`PickupPicker`). Measured and not assumed, because this bar is not one
 * height — it is taller on the tracking section, and taller again while the
 * confirm bar is unfolded into it.
 */
export const NAV_ID = "bottom-nav";

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
  if (
    SCREENS_WITHOUT_NAV.some((href) => isActivePath(pathname, href)) ||
    ORDER_DETAIL.test(pathname)
  ) {
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
      id={NAV_ID}
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
      {/* Whatever the screen underneath hangs in the bar — see NAV_SLOT_ID.
          `contents` so the panel becomes a flex child of the bar itself and
          takes its full width; an empty slot adds nothing to the layout. */}
      <div id={NAV_SLOT_ID} className="contents" />

      {/* On the tracking section the bar carries «الطلبات السابقة» above the
          tabs — Component 63 in the design, used on every tracking state, not
          just the empty one. It lives here rather than on the page because the
          design draws it inside the bar's surface, under the same top border. */}
      {onTracking && (
        <Link
          href="/history"
          prefetch
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
              // `prefetch` in full, not just down to the loading boundary. The
              // default stops at `loading.tsx`, which buys the grey skeleton and
              // nothing else — the tab's own data is still fetched on the tap,
              // and the customer still waits, just with something to look at.
              // In full, the page is already in hand when he presses, and Next
              // holds it for five minutes (`staleTimes.static`).
              //
              // Three tabs on every screen is three page renders the server does
              // in the background per screen. On a farm with tens of customers
              // that is nothing, and it is exactly what the customer is waiting
              // on. (Production only — a dev server never prefetches.)
              prefetch
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
