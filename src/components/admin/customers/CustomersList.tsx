"use client";

import { useMemo, useState } from "react";
import { EmptyState, SearchField } from "@/components/ui";
import type { CustomerSummary } from "@/lib/queries/customers";
import { matchesNameOrPhone } from "@/lib/search";
import { useUrlParam } from "@/hooks/useUrlParam";
import { CustomersFilterBar } from "./CustomersFilterBar";
import { CustomerRow } from "./CustomerRow";

const readDebtOnly = (raw: string | null) => raw === "1";
const writeDebtOnly = (debtOnly: boolean) => (debtOnly ? "1" : null);

/**
 * The searchable part of the customers screen (A-30): the count + «الآجل» pills,
 * the search box, and the rows themselves.
 *
 * Search filters the list the page already loaded, in the browser — no round trip
 * per keystroke, and results appear as fast as he types. A family farm has tens of
 * customers, not thousands; the same reasoning as the order sheet's picker.
 *
 * «الآجل» filters the same loaded list, on the same line as the search. It keeps
 * its place in the URL (D-26) because it is a view worth surviving a refresh,
 * while a half-typed name is not — but keeping it there costs nothing now
 * (D-31). It used to re-run the whole page to fetch the very rows already on
 * screen, and the pill took about a second to light up.
 */
export function CustomersList({
  customers,
  initialDebtOnly,
  children,
}: {
  customers: CustomerSummary[];
  /** Whatever `?debt=` said when the page was opened or shared. */
  initialDebtOnly: boolean;
  /** The screen's toolbar, so it can live inside the one pinned header block. */
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [debtOnly, setDebtOnly] = useUrlParam(
    "debt",
    initialDebtOnly,
    readDebtOnly,
    writeDebtOnly,
  );

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
      {/* Held in place while the rows scroll under it. */}
      <div className="sticky top-0 z-10 flex flex-col gap-4 bg-background pt-4 pb-3">
        {children}

        <CustomersFilterBar
          count={visible.length}
          debtOnly={debtOnly}
          onToggle={setDebtOnly}
        />

        <div className="px-screen">
          <SearchField
            placeholder="ابحث باسم العميل او رقم الهاتف"
            label="ابحث عن عميل"
            value={query}
            onChange={setQuery}
          />
        </div>
      </div>

      {/* No gutter here: it sits on the rows instead, so the dividers run the
          full width of the screen the way the design draws them. */}
      <div className="pb-4">
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
