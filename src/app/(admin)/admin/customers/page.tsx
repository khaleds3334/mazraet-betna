import { redirect } from "next/navigation";
import { CustomersToolbar } from "@/components/admin/customers/CustomersToolbar";
import { CustomersList } from "@/components/admin/customers/CustomersList";
import { getCurrentFarm } from "@/lib/queries/admin";
import { listCustomerSummaries } from "@/lib/queries/customers";
import { getDefaultOrdersCycle } from "@/lib/queries/cycles";

/**
 * Admin customers list (A-30, FR-8) — the farm's permanent customer base with
 * what each one still owes, searchable and filterable down to the debtors (A-31).
 * Each row opens in place to show that customer's standing.
 */
export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ debt?: string }>;
}) {
  const farm = await getCurrentFarm();
  if (!farm) redirect("/logout");

  const [{ debt }, cycle] = await Promise.all([
    searchParams,
    // The same cycle the orders screen defaults to — the running one, or the last
    // to end — so "طلبات الدورة" on a row means the same on both screens.
    getDefaultOrdersCycle(farm.farmId),
  ]);
  const customers = await listCustomerSummaries(
    farm.farmId,
    cycle?.cycleId ?? null,
  );

  // The header always reports the whole farm; only the list narrows.
  const totalDebt = customers.reduce((sum, customer) => sum + customer.debt, 0);

  return (
    // One scroll container (<main>) with a `sticky` header, same frame as the
    // orders screen — see the note there for why nesting a second scroller
    // inside it goes wrong on a phone. The toolbar is handed to the list as
    // children so it can sit inside the one pinned block, together with the
    // filter pills and the search box that depend on the list's own state.
    <div className="flex flex-col">
      <CustomersList customers={customers} initialDebtOnly={debt === "1"}>
        <CustomersToolbar totalDebt={totalDebt} />
      </CustomersList>
    </div>
  );
}
