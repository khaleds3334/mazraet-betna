import { Suspense } from "react";
import { Toaster } from "@/components/ui";
import { BackGuard } from "@/components/layout/BackGuard";
import { BottomNav } from "@/components/layout/BottomNav";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { LiveRefresh } from "@/components/layout/LiveRefresh";
import { RefreshOnReturn } from "@/components/layout/RefreshOnReturn";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { countActiveOrders } from "@/lib/queries/orders";

/**
 * The bar, with the number on «تتبع الطلب».
 *
 * Split out and suspended so the count is the only thing in the shell that waits
 * on the database. It is two reads deep — who is signed in, then how many of his
 * orders are running — and while the layout itself awaited them, **nothing at
 * all** was on screen: not the bar, not the background, and not the page's own
 * `loading.tsx`, which cannot start until the layout above it has finished.
 * The frame was waiting on a badge (Khaled, 2026-08-25).
 */
async function NavWithBadge() {
  const customer = await getCurrentCustomer();
  const activeOrders = customer ? await countActiveOrders(customer.id) : 0;
  return <BottomNav activeOrders={activeOrders} />;
}

/**
 * Shell for the customer app: a centered mobile column with the shared bottom
 * nav and the toast host. Route protection (only a customer reaches here) is
 * handled in the middleware; this layout just supplies the frame.
 *
 * **Not `async`.** It reads nothing, so it renders on the first pass and the
 * screen has its chrome immediately; the page below streams into it behind its
 * own skeleton, and the badge streams into the bar behind its own fallback.
 */
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Fixed to the viewport (h-svh + overflow-hidden): the page body never
    // scrolls — only <main> scrolls internally — matching the admin shell, so the
    // app behaves like an installed app (stable chrome, no accidental
    // pull-to-refresh, no browser scroll quirks against the fixed nav).
    // `svh` and not `dvh` for the same reason as the admin shell — see there.
    <div
      className="mx-auto flex h-svh w-full max-w-[430px] flex-col overflow-hidden bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Toaster />
      <BackGuard home="/" />
      {/* Every word arrives from here, so each half of the site says its own
          (Figma 2948:1273 — the customer's C-Comp_PWA_InstallBanner). The two
          are two installed apps with two manifests and two icons; the banner is
          one component and knows which it is offering. */}
      <InstallPrompt
        app="customer"
        title="لسهولة الوصول للموقع"
        body="يمكنك اضافة الموقع كتطبيق علي الشاشة الرئيسية"
        manualBody="من زرار المشاركة تحت، اختار «إضافة إلى الشاشة الرئيسية»"
        installLabel="تحميل"
        laterLabel="لاحقاً"
      />
      <RefreshOnReturn />
      {/* What can change under a customer who is looking at the screen: the
          admin opening or closing the sale (`cycle`), moving the kilo price
          (`settings`), taking one of his orders through the stages (`orders` —
          the tracking cards and the count on their tab), and the notices that
          follow (`notification` — the bell's badge). */}
      <LiveRefresh tables={["cycle", "settings", "orders", "notification"]} />
      {/* Bottom padding clears the fixed BottomNav (its height + safe area). */}
      <main className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[calc(var(--spacing-nav)+env(safe-area-inset-bottom))]">
        {children}
      </main>
      {/* The same bar without its number — identical in every other respect, so
          the badge simply appears rather than the bar arriving late. */}
      <Suspense fallback={<BottomNav />}>
        <NavWithBadge />
      </Suspense>
    </div>
  );
}
