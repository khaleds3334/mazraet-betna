"use client";

import { useState } from "react";
import { AddButton } from "@/components/ui";
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
  saleOpen,
}: {
  customers: CustomerOption[];
  weights: number[];
  defaultCleaning: boolean;
  /** False outside مرحلة البيع. The button still opens — a dead pill explains
   *  nothing, and the sheet is where the reason fits. */
  saleOpen: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AddButton
        label="اضافة طلب"
        icon="addOrder"
        onClick={() => setOpen(true)}
      />

      <AddOrderSheet
        open={open}
        onClose={() => setOpen(false)}
        customers={customers}
        weights={weights}
        defaultCleaning={defaultCleaning}
        saleOpen={saleOpen}
      />
    </>
  );
}
