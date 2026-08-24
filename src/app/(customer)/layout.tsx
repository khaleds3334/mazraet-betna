import { Toaster } from "@/components/ui";
import { BackGuard } from "@/components/layout/BackGuard";
import { BottomNav } from "@/components/layout/BottomNav";
import { RefreshOnReturn } from "@/components/layout/RefreshOnReturn";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { countActiveOrders } from "@/lib/queries/orders";

/**
 * Shell for the customer app: a centered mobile column with the shared bottom
 * nav and the toast host. Route protection (only a customer reaches here) is
 * handled in the middleware; this layout just supplies the frame and the
 * in-progress order count for the nav badge.
 */
export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCurrentCustomer();
  const activeOrders = customer ? await countActiveOrders(customer.id) : 0;

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
      <RefreshOnReturn />
      {/* Bottom padding clears the fixed BottomNav (its height + safe area). */}
      <main className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[calc(var(--spacing-nav)+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav activeOrders={activeOrders} />
    </div>
  );
}
