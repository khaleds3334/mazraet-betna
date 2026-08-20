"use client";

import { useEffect, useState } from "react";
import { BottomSheet, Chip, CloseButton, InlineError, Skeleton } from "@/components/ui";
import { ContactLinks } from "@/components/shared/ContactLinks";
import { OrderCard } from "@/components/admin/orders/card/OrderCard";
import { fetchCustomerOrders } from "@/lib/actions/customers";
import { formatArabicNumber } from "@/lib/format";
import type { CustomerOrder } from "@/lib/queries/orders";
import type { CustomerSummary } from "@/lib/queries/customers";
import { DebtAmount } from "./DebtAmount";

/** Which slice of the history is showing. */
const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "current", label: "الدورة الحالية" },
  { key: "past", label: "القديم" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

/**
 * A customer's order history (A-32) — the sheet behind the expanded row. Their
 * name and number at the top with what they still owe, a filter across cycles,
 * and every order they ever placed as the same card the orders screen draws.
 *
 * **The same card, deliberately.** An order looks and behaves one way in this app:
 * the invoice opens from it, a payment is recorded on it. Redrawing a lighter
 * version here would mean two cards to keep in step, and the admin learning the
 * order twice.
 *
 * The history is fetched when the sheet opens, not with the screen — the list
 * would otherwise ship every customer's orders to open one of them. Filtering
 * afterwards is client-side over what was fetched, the same split as the search
 * box on the screen behind it (T-32).
 */
export function CustomerOrdersSheet({
  open,
  onClose,
  customer,
  index,
  salePrice,
  cleaningPrice,
  weights,
}: {
  open: boolean;
  onClose: () => void;
  customer: CustomerSummary;
  /** Their place in the list — the row is titled by it, so the sheet is too. */
  index: number;
  salePrice: number;
  cleaningPrice: number;
  weights: number[];
}) {
  // One piece of state, not two: the fetch has exactly one outcome, and holding
  // it whole means the effect never touches state except in its callback.
  const [result, setResult] = useState<
    { orders: CustomerOrder[] } | { error: string } | null
  >(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    fetchCustomerOrders(customer.id).then((response) => {
      if (cancelled) return;
      setResult(
        response.ok ? { orders: response.orders } : { error: response.error },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [open, customer.id]);

  const orders = result && "orders" in result ? result.orders : null;
  const error = result && "error" in result ? result.error : null;

  const shown = (orders ?? []).filter((order) =>
    filter === "all"
      ? true
      : filter === "current"
        ? order.inCurrentCycle
        : !order.inCurrentCycle,
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label={`طلبات ${customer.name}`}
      header={
        <div className="flex flex-col gap-3 px-screen pt-5 pb-3">
          {/* Who, and the way out. */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-4 text-h6 font-bold text-heading">
              <span>{formatArabicNumber(index)}-</span>
              <span className="truncate">{customer.name}</span>
            </h2>
            <CloseButton onClick={onClose} />
          </div>

          {/* How to reach them, and what they still owe. */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-4">
              <span className="text-base tabular-nums text-foreground">
                {customer.phone}
              </span>
              <ContactLinks phone={customer.phone} className="gap-2" />
            </div>
            <DebtAmount amount={customer.debt} iconSize={22} />
          </div>

          <div className="flex items-center justify-center gap-2.5 overflow-x-auto">
            {FILTERS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                selected={filter === option.key}
                onClick={() => setFilter(option.key)}
              />
            ))}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3 px-screen pb-2">
        {error && <InlineError message={error} />}

        {!orders && !error && (
          <>
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </>
        )}

        {orders && shown.length === 0 && !error && (
          <p className="py-10 text-center text-muted">
            {filter === "all"
              ? "العميل ده لسه ماطلبش حاجة"
              : "مفيش طلبات في الفترة دي"}
          </p>
        )}

        {shown.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            salePrice={salePrice}
            cleaningPrice={cleaningPrice}
            weights={weights}
          />
        ))}
      </div>
    </BottomSheet>
  );
}
