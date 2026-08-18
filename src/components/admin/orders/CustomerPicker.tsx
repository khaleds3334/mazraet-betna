"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import type { CustomerOption } from "@/lib/queries/customers";
import { cn } from "@/lib/utils";

/** Matches on name or phone, so the admin can search however he remembers them. */
function matches(customer: CustomerOption, query: string): boolean {
  const q = query.trim();
  return customer.name.includes(q) || customer.phone.includes(q);
}

/**
 * Picks the customer an order belongs to (A-56). The search box is the one drawn
 * in the design; the results list under it is not — it is the smallest addition
 * that makes the box usable (Khaled, 2026-08-18).
 *
 * Filtering happens in the browser over the farm's customers, loaded once with
 * the screen — no round trip per keystroke.
 */
export function CustomerPicker({
  customers,
  selected,
  onSelect,
  disabled = false,
}: {
  customers: CustomerOption[];
  selected: CustomerOption | null;
  onSelect: (customer: CustomerOption | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => (query.trim() ? customers.filter((c) => matches(c, query)) : []),
    [customers, query],
  );

  // A picked customer replaces the field with their name — the box then reads as
  // "this is the order's customer" instead of a search that happens to have text.
  if (selected) {
    return (
      <div className="flex min-h-13 items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4">
        <span className="min-w-0 truncate text-base text-primary-foreground">
          {selected.name}
          <span className="mr-2 text-sm text-foreground">{selected.phone}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQuery("");
          }}
          aria-label="شيل العميل"
          className="flex size-11 shrink-0 items-center justify-center text-foreground"
        >
          <Icon name="close" size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "flex min-h-13 items-center gap-4 rounded-lg border border-border bg-surface px-4",
          disabled && "opacity-60",
        )}
      >
        <Icon name="search" size={32} className="shrink-0 text-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={disabled}
          aria-label="ابحث عن العميل"
          placeholder="ابحث باسم العميل او رقم الهاتف"
          className="min-w-0 flex-1 bg-transparent text-right text-sm text-primary-foreground outline-none placeholder:text-disabled"
        />
      </div>

      {query.trim() && (
        <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-white shadow-card">
          {results.length === 0 ? (
            <li className="px-4 py-3 text-right text-sm text-disabled">
              مفيش عميل بالاسم ده
            </li>
          ) : (
            results.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(customer);
                    setQuery("");
                  }}
                  className="flex min-h-13 w-full flex-col items-end justify-center gap-1 border-b border-border px-4 py-2 text-right last:border-b-0"
                >
                  <span className="text-base text-primary-foreground">
                    {customer.name}
                  </span>
                  <span className="text-sm text-foreground">
                    {customer.phone}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
