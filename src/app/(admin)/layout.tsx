import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "@/components/ui";
import { AdminBottomNav } from "@/components/layout/AdminBottomNav";
import { BackGuard } from "@/components/layout/BackGuard";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { LiveRefresh } from "@/components/layout/LiveRefresh";
import { getCurrentFarm } from "@/lib/queries/admin";
import { countPendingOrders } from "@/lib/queries/orders";

/**
 * The admin half of the site advertises the **second** manifest, so "install"
 * from any admin screen adds «لوحة التحكم» to the home screen rather than a
 * second copy of the customer app. iOS ignores manifests entirely and reads the
 * page's own title and touch icon, which is why both are restated here.
 */
export const metadata: Metadata = {
  title: "لوحة التحكم",
  applicationName: "لوحة التحكم",
  manifest: "/admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "لوحة التحكم",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/admin-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/admin-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/admin-apple-touch-icon.png",
  },
};

/**
 * The bar, with «الجديدة» counted on «الطلبات».
 *
 * Suspended for the same reason the customer's is (T-70): the count is two reads
 * deep — which farm, then how many of its orders are waiting — and a layout that
 * awaits holds back the page below it *and* that page's own `loading.tsx`. The
 * bar arrives first and the number lands on it.
 */
async function NavWithBadge() {
  const farm = await getCurrentFarm();
  const pending = farm ? await countPendingOrders(farm.farmId) : 0;
  return <AdminBottomNav pendingOrders={pending} />;
}

/**
 * Shell for the admin app (lives under /admin): a centered mobile column with
 * the shared bottom nav and the toast host. Route protection (only the admin
 * reaches here) is handled in the middleware; this layout supplies the frame.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Fixed to the viewport (h-svh + overflow-hidden): the page body itself never
    // scrolls — only <main> scrolls internally. This stops the browser from
    // treating the document as scrollable and drawing the Android system-nav-bar
    // scrim, which otherwise seams against our bottom nav on taller screens.
    //
    // `svh`, never `dvh`: `dvh` is the viewport *right now*, so the shell grows
    // by ~60px the moment the browser retracts its address bar, and everything
    // sitting under the tab bar jumps into view mid-swipe as if the page had
    // scrolled a second time. `svh` is the height with the browser's UI showing
    // — a number that never changes — so the shell holds still.
    <div
      className="mx-auto flex h-svh w-full max-w-[430px] flex-col overflow-hidden bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Toaster />
      <BackGuard home="/admin" />
      {/* `orders` only. Everything else on the admin's screens changes because
          *he* changed it, and his own writes already revalidate — the one thing
          that arrives without him is a customer placing an order, which is the
          screen he is standing in front of when it happens. */}
      <LiveRefresh tables={["orders"]} />
      {/* Every word arrives from here, so the customer app can say its own
          (Figma 3799:4013 — C-Comp_PWA_InstallBanner). */}
      <InstallPrompt
        app="admin"
        title="لسهولة الوصول للوحة التحكم"
        body="يمكنك اضافة لوحة التحكم كتطبيق علي الشاشة الرئيسية"
        manualBody="من زرار المشاركة تحت، اختار «إضافة إلى الشاشة الرئيسية»"
        installLabel="تحميل"
        laterLabel="لاحقاً"
      />
      {/* Bottom padding clears the fixed AdminBottomNav (its height + safe area).
          `overscroll-contain` keeps a swipe past the last row from reaching the
          document, which is what invites the browser to retract its address bar. */}
      <main className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[calc(var(--spacing-nav)+env(safe-area-inset-bottom))]">
        {children}
      </main>
      {/* The same bar without its number, so the badge appears rather than the
          bar arriving late. `CountBadge` draws nothing at zero. */}
      <Suspense fallback={<AdminBottomNav />}>
        <NavWithBadge />
      </Suspense>
    </div>
  );
}
