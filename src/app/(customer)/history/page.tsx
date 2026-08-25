import { redirect } from "next/navigation";
import { EmptyOrders } from "@/components/customer/EmptyOrders";
import { HistoryHeading } from "@/components/customer/history/HistoryHeading";
import { HistoryList } from "@/components/customer/history/HistoryList";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { getActiveSaleState } from "@/lib/queries/cycles";
import { listCustomerPastOrders } from "@/lib/queries/orders";

/**
 * C-50 → C-52 — «طلباتك السابقة»: every order that has finished, either way it
 * finished (FR-29).
 *
 * The list is read whole rather than counted first. The two branches need
 * different things — the empty state needs to know whether the sale is open, the
 * list needs the orders — and a count would have been a third query answering
 * neither. A customer's finished orders are a handful.
 *
 * This is a screen you walk into, not a tab: it has a back button and **no
 * bottom bar** — `BottomNav` stands itself down here. The room `<main>` reserves
 * for that bar is left in place all the same (Khaled removed the `-mb-nav` that
 * took it back, be2f38e): it reads as the list's bottom margin, and the empty
 * state centres against it happily enough.
 */
export default async function HistoryPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/logout");

  const [orders, sale] = await Promise.all([
    listCustomerPastOrders(customer.farmId, customer.id),
    getActiveSaleState(customer.farmId),
  ]);

  // The heading is drawn by whichever branch owns the screen: the list pins it
  // to the top with the filter chips (they are one block, and only the cards
  // scroll under it), the empty state just puts it there.
  if (orders.length > 0) return <HistoryList orders={orders} />;

  return (
    <div className="flex flex-1 flex-col">
      <HistoryHeading />

      {/* Centred in what is left under the caption — `my-auto` rather than
          `justify-center` so a short screen scrolls instead of hiding the top. */}
      <div className="my-auto">
        <EmptyOrders
          titleLines={["ليس لديك اي طلبات", "مكتملة حاليا"]}
          saleOpen={sale?.saleOpen ?? false}
        />
      </div>
    </div>
  );
}
