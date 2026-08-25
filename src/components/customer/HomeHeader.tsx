"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CountBadge, Icon } from "@/components/ui";
import { Sidebar } from "@/components/layout/Sidebar";

/**
 * The home header (states C-10→C-12): the ☰ button on the right (RTL leading
 * edge) opens the sidebar, the logo sits in the middle, and the notification
 * bell on the left carries an unread badge. Order is [menu, logo, bell] so RTL
 * places the menu on the right and the bell on the left.
 */
export function HomeHeader({
  unreadCount,
  customerName,
  debtAmount,
}: {
  unreadCount: number;
  customerName: string;
  debtAmount: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Sticky, so the logo and the two controls stay reachable while the page
          scrolls. It needs its own `bg-background` — without one the content
          would show through as it slides underneath. */}
      <header className="sticky top-0 z-20 flex h-[86px] items-center justify-between bg-background px-screen">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="القائمة"
          className="flex size-11 items-center justify-center text-foreground"
        >
          <Icon name="menu" size={32} strokeWidth={2.5} absoluteStrokeWidth />
        </button>

        <Image
          src="/images/logo-primary.png"
          alt="مزرعة بيتنا"
          width={76}
          height={80}
          priority
        />

        <Link
          href="/notifications"
          replace
          aria-label="الإشعارات"
          className="flex size-11 items-center justify-center text-foreground"
        >
          {/* Wrapped so the badge pins to the bell itself, not to the 44px tap
            target around it — same corner rule as the bottom nav. */}
          <span className="relative">
            <Icon
              name="notification"
              size={32}
              strokeWidth={2.5}
              absoluteStrokeWidth
            />
            <CountBadge count={unreadCount} tone="accent" placement="inset" />
          </span>
        </Link>
      </header>

      {/* Outside the <header> on purpose: a sticky element carrying a z-index
          opens a stacking context, and the drawer (z-45) would be trapped
          inside it — sliding out underneath the bottom nav (z-40). */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        customerName={customerName}
        debtAmount={debtAmount}
      />
    </>
  );
}
