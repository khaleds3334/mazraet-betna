import { redirect } from "next/navigation";
import { ComingSoon, PageHeader } from "@/components/ui";
import { EmptyOrders } from "@/components/customer/EmptyOrders";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getActiveSaleState } from "@/lib/queries/cycles";
import { countPastOrders } from "@/lib/queries/orders";

/**
 * C-50 — «طلباتك السابقة». Only the empty state is built so far; the list
 * (C-51/C-52) is the next step.
 *
 * This is a screen you walk into, not a tab: it has a back button and **no
 * bottom bar** (`BottomNav` stands itself down here). `-mb-nav` gives back the
 * room <main> reserves for that bar, so the block below centres against the
 * real bottom of the screen rather than 70px above it.
 */
export default async function HistoryPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/logout");

  const [pastOrders, sale] = await Promise.all([
    countPastOrders(customer.id),
    getActiveSaleState(customer.farmId),
  ]);

  return (
    <div className="-mb-nav flex flex-1 flex-col">
      <PageHeader
        title="طلباتك السابقة"
        backHref="/"
        className="px-screen pt-4"
      />

      {/* Held to a narrow measure so it breaks over two lines the way the design
          draws it — at full width it would sit on one. No `px-screen`: the
          padding would eat into the 180px and push it onto a third line, and
          the measure is already far narrower than the narrowest phone. */}
      <p className="mx-auto max-w-[180px] pt-2 text-center text-base text-foreground">
        هنا تقدر تشوف كل طلباتك، وحالات الدفع
      </p>

      {pastOrders > 0 ? (
        <ComingSoon title="الطلبات السابقة" />
      ) : (
        // Centred in what is left under the caption — `my-auto` rather than
        // `justify-center` so a short screen scrolls instead of hiding the top.
        <div className="my-auto">
          <EmptyOrders
            titleLines={["ليس لديك اي طلبات", "مكتملة حاليا"]}
            saleOpen={sale?.saleOpen ?? false}
          />
        </div>
      )}
    </div>
  );
}
