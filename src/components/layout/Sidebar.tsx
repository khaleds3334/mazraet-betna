"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import type { IconName } from "@/lib/icons";
import { signOut } from "@/lib/actions/auth";
import { formatCurrency } from "@/lib/format";
import { cn, isActivePath } from "@/lib/utils";

/**
 * The customer sidebar (C-13), opened from the home header's ☰ button. Matches
 * the design: greeting, the outstanding-debt card (FR-30), the main navigation,
 * an FAQ link, and sign-out. The home page stays mounted behind it — a
 * semi-transparent scrim dims it and closes the drawer on tap.
 *
 * Drawer on the right (the leading edge in RTL); slides off to the right when
 * closed. Controlled by the parent (HomeHeader).
 */
interface NavItem {
  label: string;
  icon: IconName;
  href?: string; // absent → not wired yet (placeholder)
  exact?: boolean; // home matches exactly so it doesn't stay lit on sub-pages
}

const NAV: NavItem[] = [
  { label: "الصفحة الرئيسية", icon: "home", href: "/", exact: true },
  { label: "طلباتي السابقة", icon: "pastOrders", href: "/history" },
  { label: "حول التطبيق", icon: "infoSquare" },
  { label: "تواصل معنا", icon: "telephone" },
];

export function Sidebar({
  open,
  onClose,
  customerName,
  debtAmount,
}: {
  open: boolean;
  onClose: () => void;
  customerName: string;
  debtAmount: number;
}) {
  const pathname = usePathname();

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="القائمة"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[300px] max-w-[75%] flex-col bg-background shadow-card transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* Greeting + settings */}
        <div className="flex h-16 items-center justify-between border-b-2 border-border px-5">
          <div className="flex items-center gap-2 text-foreground">
            <Icon name="userCircle" size={32} />
            <span className="text-base font-bold">مرحبا، {customerName}</span>
          </div>
          <button
            type="button"
            aria-label="الإعدادات"
            className="flex size-11 items-center justify-center text-foreground"
          >
            <Icon name="settings" size={32} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-6">
          {/* Debt card */}
          <div className="rounded-xl border-2 border-border bg-surface p-4">
            <div className="flex flex-col items-start gap-2">
              <span className="text-xs text-muted">المستحق للسداد</span>
              <div className="flex items-center gap-3 text-accent-tan">
                <Icon name="wallet" size={32} className="-scale-x-100" />
                <span className="text-h5 font-bold">
                  {formatCurrency(debtAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            {NAV.map((item) => {
              const active = item.href
                ? isActivePath(pathname, item.href, item.exact)
                : false;
              const content = (
                <>
                  <Icon name={item.icon} size={28} />
                  <span className="text-h6 font-bold">{item.label}</span>
                </>
              );
              const className = cn(
                "flex items-center gap-2 rounded-xl px-4 py-3",
                active
                  ? "bg-primary-soft text-primary-foreground"
                  : "text-foreground",
              );
              return item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={className}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className={cn(className, "text-start")}
                >
                  {content}
                </button>
              );
            })}
          </nav>

          {/* FAQ + sign-out, pinned to the bottom */}
          <div className="mt-auto flex flex-col items-start gap-4 pt-4">
            <button
              type="button"
              className="flex items-center gap-2 text-foreground"
            >
              <Icon name="link" size={24} />
              <span className="text-base font-bold underline">
                الاسئلة المتكررة؟
              </span>
            </button>

            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1 text-error"
              >
                <Icon name="logout" size={24} />
                <span className="text-base font-bold">تسجيل الخروج</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
