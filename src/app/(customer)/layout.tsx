import { Toaster } from "@/components/ui";
import { BottomNav } from "@/components/layout/BottomNav";
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
    <div
      className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Toaster />
      {/* Bottom padding clears the fixed BottomNav (its height + safe area). */}
      <main className="flex flex-1 flex-col pb-[calc(76px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav activeOrders={activeOrders} />
    </div>
  );
}
