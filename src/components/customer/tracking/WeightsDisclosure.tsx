"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { WeightsSection } from "@/components/shared/invoice/WeightsSection";
import type { Invoice } from "@/lib/calculations/invoice";
import { cn } from "@/lib/utils";

/**
 * «عرض الاوزان بالتفصيل» (C-44) — the invoice's total opened up into the bird-by
 * bird table it was reached from.
 *
 * Folded away by default because that is the honest default: the customer came
 * to see what the order costs, and the table is the proof behind it, wanted only
 * by whoever doubts the number. It is the same `WeightsSection` the admin's
 * invoice sheet shows, so the two can never quote different weights.
 *
 * Kept in the page rather than opened as a sheet, exactly as the design draws
 * it — the table belongs under the total it explains, and a sheet would hide the
 * total it is being compared against.
 */
export function WeightsDisclosure({ invoice }: { invoice: Invoice }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* `inline-flex` so the button is only as wide as its words and starts at
          the inline start — the right, in RTL — which is where the design hangs
          it. The row is the label with the chevron to its left.
          (Not `mx-screen`: there is no such utility, only `px-screen` — T-62.) */}
      <div className="px-screen">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex min-h-11 items-center gap-1 text-base text-foreground"
        >
          <span className="optical-center">عرض الاوزان بالتفصيل</span>
          <Icon
            name="arrowDown"
            size={24}
            aria-hidden
            className={cn("transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {/* Full-bleed: `WeightsSection` runs its own lime band edge to edge and
          keeps the gutter on everything under it. */}
      {open && <WeightsSection invoice={invoice} />}
    </div>
  );
}
