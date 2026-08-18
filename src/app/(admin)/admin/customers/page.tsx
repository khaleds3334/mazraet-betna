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
  if (!farm) redirect("/login");

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
    // `min-h-0` down the column is what pins the toolbar, the filters and the
    // search box: without it the flex children refuse to shrink and the whole
    // screen scrolls instead of the list. Same frame as the orders screen.
    <div className="flex min-h-0 flex-1 flex-col gap-4 pt-4">
      <CustomersToolbar totalDebt={totalDebt} />
      <CustomersList customers={customers} debtOnly={debt === "1"} />
    </div>
  );
}
