import Link from "next/link";
import { redirect } from "next/navigation";
import { HomeHeader } from "@/components/customer/HomeHeader";
import { ContactButton } from "@/components/customer/ContactButton";
import { SaleStatusCard } from "@/components/customer/SaleStatusCard";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getFarmContactPhone } from "@/lib/queries/admin";
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

  const [sale, unreadCount, debtAmount, contactPhone] = await Promise.all([
    getActiveSaleState(customer.farmId),
    countUnreadNotifications(customer.id),
    getCustomerDebt(customer.id),
    // Beside the others, not after them — it is one more small read and it must
    // not add a round trip to the screen the app opens on (T-68).
    getFarmContactPhone(customer.farmId),
  ]);
  const saleOpen = sale?.saleOpen ?? false;

  return (
    // pb clears the floating «تواصل معنا» pill, so the last button never ends
    // up scrolled underneath it. It sits on the page rather than on the content
    // block below, so it stays out of the space that block centres itself in.
    <div className="flex flex-1 flex-col gap-4 pb-pill">
      <HomeHeader
        unreadCount={unreadCount}
        customerName={customer.name}
        debtAmount={debtAmount}
        contactPhone={contactPhone}
      />

      {/* The three sections adapt to the height of the phone in both
          directions. Tall: `flex-1` hands this block everything left between
          the header and the pill, and `justify-evenly` spreads the sections
          through it instead of leaving dead space at the bottom. Short: there
          is nothing to spread, so the spacing falls back to `gap-section` —
          which is itself fluid (32px → 12px) and tightens far enough that the
          usual phone fits without scrolling at all. */}
      <div className="flex flex-1 flex-col justify-evenly gap-section px-screen">
        <div className="flex flex-col items-center gap-2 text-center text-h3 font-extrabold text-primary-foreground">
          <h1>مرحبا بيك في مزرعة بيتنا</h1>
          <p>لبيع الفراخ البيضاء الطازجة</p>
        </div>

        <SaleStatusCard
          status={sale?.status ?? "waiting"}
          targetDate={sale?.targetDate ?? null}
        />

        <div className="flex flex-col gap-5">
          {saleOpen ? (
            // Both CTAs are fetched in full — they are the two things this
            // screen exists to send him to, and they are on it from the moment
            // it loads. (Production only — a dev server never prefetches.)
            <Link href="/order" prefetch replace className={PRIMARY_ACTION}>
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

          <Link href="/history" prefetch replace className={OUTLINE_ACTION}>
            الطلبات السابقة
          </Link>
        </div>

      </div>

      {/* «تواصل معنا» floats: it stays reachable while the page scrolls, sitting
          24px above the bottom nav. The strip it lives in is full-width so it
          can be centred on the same 430px column as the shell, and it lets taps
          through everywhere except on the pill itself. */}
      <div
        className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-[430px] justify-end px-screen"
        style={{
          bottom: "calc(var(--spacing-nav) + 16px + env(safe-area-inset-bottom))",
        }}
      >
        <ContactButton phone={contactPhone} className="pointer-events-auto" />
      </div>
    </div>
  );
}
