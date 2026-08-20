"use client";

import { useState } from "react";
import { formatCurrency, pluralizeOrder } from "@/lib/format";
import type { CustomerSummary } from "@/lib/queries/customers";
import { CustomerOrdersSheet } from "./CustomerOrdersSheet";

/** A label with its figure beside it — the design keeps them 8px apart. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-center gap-2">
      <span>{label}</span>
      <span>{value}</span>
    </p>
  );
}

/**
 * What opens under a customer row when the admin taps it (A-31 expanded): how
 * many orders this customer has placed — in the running cycle and ever — and how
 * much of everything he was ever invoiced is already paid.
 *
 * The whole block is the way into that customer's order history (A-32) — it is a
 * summary of orders, so the orders are what it opens. The trigger is a stretched
 * overlay rather than a wrapper, the same pattern as the row above it: a button
 * may not contain paragraphs, and the figures underneath pass their taps up to it.
 */
export function CustomerRowDetails({
  id,
  index,
  customer,
  salePrice,
  cleaningPrice,
  weights,
}: {
  id: string;
  /** Their place in the list — carried into the sheet's title. */
  index: number;
  customer: CustomerSummary;
  /** Live settings, handed to the order cards inside the sheet (T-15). */
  salePrice: number;
  cleaningPrice: number;
  weights: number[];
}) {
  const [open, setOpen] = useState(false);

  // Nothing invoiced yet means nothing to show as paid — and no division by zero.
  const paidRatio =
    customer.invoiceTotal > 0
      ? Math.min(1, customer.paidTotal / customer.invoiceTotal)
      : 0;

  return (
    <div id={id} className="relative flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="absolute inset-0"
      >
        <span className="sr-only">طلبات {customer.name}</span>
      </button>

      <div className="pointer-events-none relative flex items-start justify-between gap-2 text-base font-bold text-foreground">
        <Figure
          label="طلبات الدورة:"
          value={pluralizeOrder(customer.ordersInCycle)}
        />
        <Figure label="إجمالي:" value={pluralizeOrder(customer.ordersTotal)} />
      </div>

      <div className="pointer-events-none relative flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 text-sm text-heading">
          <p>إجمالي: {formatCurrency(customer.invoiceTotal)}</p>
          <p>مدفوع: {formatCurrency(customer.paidTotal)}</p>
        </div>

        {/*
          How much of the invoiced total is paid: green is the paid share, tan the
          amount still owed — the same tan that marks a debt everywhere else in the
          app. It fills from the physical left, under the "مدفوع" label, so
          `left-0` is deliberate and must not become a logical `start-0`, which
          would flip it in RTL.
        */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-accent-tan">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-brand"
            style={{ width: `${paidRatio * 100}%` }}
          />
        </div>
      </div>

      <CustomerOrdersSheet
        open={open}
        onClose={() => setOpen(false)}
        customer={customer}
        index={index}
        salePrice={salePrice}
        cleaningPrice={cleaningPrice}
        weights={weights}
      />
    </div>
  );
}
