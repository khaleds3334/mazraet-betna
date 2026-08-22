import Link from "next/link";
import { redirect } from "next/navigation";
import { HomeHeader } from "@/components/customer/HomeHeader";
import { ContactButton } from "@/components/customer/ContactButton";
import { SaleStatusCard } from "@/components/customer/SaleStatusCard";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getActiveSaleState } from "@/lib/queries/cycles";
import { getCustomerDebt } from "@/lib/queries/orders";
import { countUnreadNotifications } from "@/lib/queries/notifications";
import { actionBase, actionPrimary, actionOutline } from "@/components/ui/buttonStyles";
import { cn } from "@/lib/utils";

/** Home CTAs are links, not buttons, so they borrow the shared <Button> look. */
const PRIMARY_ACTION = cn(actionBase, actionPrimary);
const OUTLINE_ACTION = cn(actionBase, actionOutline);

/**
 * Customer home (C-10→C-12). Shows the welcome, the live sale status card, and
 * the two main actions. When the sale is closed, the order button is blurred and
 * inert — the customer can only order while the sale is open (FR-25, FR-27).
 */
export default async function CustomerHomePage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/logout");

  const [sale, unreadCount, debtAmount] = await Promise.all([
    getActiveSaleState(customer.farmId),
    countUnreadNotifications(customer.id),
    getCustomerDebt(customer.id),
  ]);
  const saleOpen = sale?.saleOpen ?? false;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <HomeHeader
        unreadCount={unreadCount}
        customerName={customer.name}
        debtAmount={debtAmount}
      />

      <div className="flex flex-col gap-8 px-screen pb-4">
        <div className="flex flex-col items-center gap-2 text-center text-h3 font-extrabold text-primary-foreground">
          <h1>مرحبا بيك في مزرعة بيتنا</h1>
          <p>لبيع الفراخ البيضاء الطازجة</p>
        </div>

        <SaleStatusCard
          status={sale?.status ?? "waiting"}
          targetDate={sale?.targetDate ?? null}
        />

        <div className="flex flex-col gap-6">
          {saleOpen ? (
            <Link href="/order" replace className={PRIMARY_ACTION}>
              اطلب فراخ طازجة دلوقتي
            </Link>
          ) : (
            <div
              aria-disabled
              className={cn(
                PRIMARY_ACTION,
                "pointer-events-none select-none opacity-90 blur-[3px]",
              )}
            >
              اطلب فراخ طازجة دلوقتي
            </div>
          )}

          <Link href="/history" replace className={OUTLINE_ACTION}>
            الطلبات السابقة
          </Link>
        </div>

        <ContactButton className="self-end" />
      </div>
    </div>
  );
}
