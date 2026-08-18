"use client";

import { useId, useState } from "react";
import { ContactLinks } from "@/components/shared/ContactLinks";
import { formatArabicNumber } from "@/lib/format";
import type { CustomerSummary } from "@/lib/queries/customers";
import { CustomerRowDetails } from "./CustomerRowDetails";
import { DebtAmount } from "./DebtAmount";
import { EditCustomerButton } from "./EditCustomerButton";

/**
 * One customer in the admin's list (A-30). Tapping the top half opens the summary
 * under it, tapping it again closes it.
 *
 * The toggle is a button stretched across the top half rather than a wrapper
 * around it: the contact shortcuts live inside that area, and a button may not
 * contain other buttons or links. The two content lines pass taps through to the
 * toggle underneath, and the contact pair takes its own back.
 */
export function CustomerRow({
  index,
  customer,
}: {
  index: number;
  customer: CustomerSummary;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  return (
    <div className="flex flex-col gap-1.5 px-screen py-3">
      <div className="relative flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setOpen((wasOpen) => !wasOpen)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="absolute inset-0"
        >
          <span className="sr-only">تفاصيل {customer.name}</span>
        </button>

        {/* Name line. The pen appears only once the row is open, the way the
            design draws it, and takes its own taps back from the toggle. */}
        <div className="pointer-events-none relative flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-4 text-h6 font-bold text-heading">
            <span>{formatArabicNumber(index)}-</span>
            <span className="truncate">{customer.name}</span>
          </p>
          {open && (
            <EditCustomerButton
              customer={customer}
              className="pointer-events-auto"
            />
          )}
        </div>

        {/* Contact line: how to reach him on the right, what he owes on the left. */}
        <div className="pointer-events-none relative flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-5.5">
            {/*
              Fixed width, not auto: Almarai's digits differ in width, so an
              auto-sized number nudges the two contact buttons a few pixels left
              or right on every row and they stop reading as one column down the
              list. 11ch is the length of an Egyptian mobile; a shorter number
              just sits right-aligned in the same box.

              It can still shrink, because the design's row needs ~315px and a
              320px screen only has 288px to give. Above ~355px there is slack, so
              the box keeps its 11ch and the column stays true; below that the
              number gives way rather than the row overflowing sideways.
            */}
            <span className="w-[11ch] min-w-0 truncate text-right text-base tabular-nums text-foreground">
              {customer.phone}
            </span>
            <ContactLinks
              phone={customer.phone}
              className="pointer-events-auto gap-2"
            />
          </div>

          <DebtAmount amount={customer.debt} iconSize={22} />
        </div>
      </div>

      {open && <CustomerRowDetails id={detailsId} customer={customer} />}
    </div>
  );
}
