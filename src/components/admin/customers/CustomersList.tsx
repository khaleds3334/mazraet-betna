"use client";

import { useMemo, useState } from "react";
import { EmptyState, SearchField } from "@/components/ui";
import type { CustomerSummary } from "@/lib/queries/customers";
import { matchesNameOrPhone } from "@/lib/search";
import { CustomersFilterBar } from "./CustomersFilterBar";
import { CustomerRow } from "./CustomerRow";

/**
 * The searchable part of the customers screen (A-30): the count + «الآجل» pills,
 * the search box, and the rows themselves.
 *
 * Search filters the list the page already loaded, in the browser — no round trip
 * per keystroke, and results appear as fast as he types. A family farm has tens of
 * customers, not thousands; the same reasoning as the order sheet's picker. The
 * «الآجل» filter stays in the URL (D-26) because it's a view worth keeping across
 * a refresh, while a half-typed name is not.
 */
export function CustomersList({
  customers,
  debtOnly,
}: {
  customers: CustomerSummary[];
  debtOnly: boolean;
}) {
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      customers.filter(
        (customer) =>
          (!debtOnly || customer.debt > 0) &&
          matchesNameOrPhone(customer, query),
      ),
    [customers, debtOnly, query],
  );

  // Three different nothings: nothing matched what he typed, nobody owes
  // anything, or the farm has no customers at all. The first has no design —
  // it borrows the empty state's shape with its own sentence.
  const emptyTitle = query.trim()
    ? "مفيش عميل بالاسم او الرقم ده"
    : debtOnly
      ? "لا يوجد عملاء عليهم آجل"
      : "لا يوجد اي عملاء حاليا";

  return (
    <>
      <CustomersFilterBar count={visible.length} debtOnly={debtOnly} />

      <div className="px-screen">
        <SearchField
          placeholder="ابحث باسم العميل او رقم الهاتف"
          label="ابحث عن عميل"
          value={query}
          onChange={setQuery}
        />
      </div>

      {/* Only this region scrolls. The gutter is on the rows, not here, so the
          dividers run the full width of the screen the way the design draws them. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          // 78px under the search box is where the design puts the ring, and it
          // stays put on any screen height rather than centring in what's left.
          <div className="px-screen">
            <EmptyState
              icon="customers"
              title={emptyTitle}
              className="pt-19.5"
            />
          </div>
        ) : (
          // `divide-y` rather than a border on each row: it draws the line
          // *between* rows, so the last one has nothing under it.
          <ul className="divide-y-2 divide-border">
            {visible.map((customer, position) => (
              <li key={customer.id}>
                <CustomerRow index={position + 1} customer={customer} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
