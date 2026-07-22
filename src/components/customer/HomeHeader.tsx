"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { Sidebar } from "@/components/layout/Sidebar";
import { formatArabicNumber } from "@/lib/format";

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
    <header className="flex h-[99px] items-center justify-between px-screen pt-2">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="القائمة"
        className="flex size-11 items-center justify-center text-foreground"
      >
        <Icon name="menu" size={32} />
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
        aria-label="الإشعارات"
        className="relative flex size-11 items-center justify-center text-foreground"
      >
        <Icon name="notification" size={32} />
        {unreadCount > 0 && (
          <span className="absolute start-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-accent-tan bg-accent-orange px-1 text-[11px] font-bold text-primary-foreground">
            {formatArabicNumber(unreadCount)}
          </span>
        )}
      </Link>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        customerName={customerName}
        debtAmount={debtAmount}
      />
    </header>
  );
}
