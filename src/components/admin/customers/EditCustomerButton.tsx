"use client";

import { useState } from "react";
import { PenGlyph } from "@/components/shared/PenGlyph";
import type { CustomerOption } from "@/lib/queries/customers";
import { CustomerSheet } from "./CustomerSheet";
import { cn } from "@/lib/utils";

/**
 * The pen on an opened customer row — it opens «تعديل بيانات العميل» (A-35).
 *
 * The glyph is the 24px one the design draws, but the *tap* area is grown to 44px
 * by an invisible inset (rule 8) instead of by padding: padding would stretch the
 * 22px name line it sits on and push the row's layout around.
 */
export function EditCustomerButton({
  customer,
  className,
}: {
  customer: CustomerOption;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`تعديل بيانات ${customer.name}`}
        className={cn(
          "relative shrink-0 text-foreground before:absolute before:-inset-2.5 before:content-['']",
          className,
        )}
      >
        <PenGlyph size={24} />
      </button>

      <CustomerSheet
        open={open}
        onClose={() => setOpen(false)}
        customer={customer}
      />
    </>
  );
}
