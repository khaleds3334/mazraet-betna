"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import type { CustomerOption } from "@/lib/queries/customers";
import { AddOrderSheet } from "./AddOrderSheet";

/**
 * The "اضافة طلب" button on the orders toolbar, plus the sheet it opens. A small
 * client island so the orders screen itself stays a server component — the same
 * pattern as `CreateCycleLauncher`.
 */
export function AddOrderLauncher({
  customers,
  weights,
  defaultCleaning,
}: {
  customers: CustomerOption[];
  weights: number[];
  defaultCleaning: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-brand bg-brand px-4 text-base text-surface-page transition-transform active:scale-[0.99]"
      >
        <span className="flex size-5 items-center justify-center">
          <Icon name="addOrder" size={14} />
        </span>
        <span className="optical-center">اضافة طلب</span>
      </button>

      <AddOrderSheet
        open={open}
        onClose={() => setOpen(false)}
        customers={customers}
        weights={weights}
        defaultCleaning={defaultCleaning}
      />
    </>
  );
}
