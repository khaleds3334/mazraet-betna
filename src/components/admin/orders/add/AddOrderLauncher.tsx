"use client";

import { useState } from "react";
import { AddButton } from "@/components/ui";
import type { CustomerOption } from "@/lib/queries/customers";
import type { OrderListItem } from "@/lib/queries/orders";
import { WeighingSheet } from "../weighing/WeighingSheet";
import { AddOrderSheet } from "./AddOrderSheet";

/**
 * The "اضافة طلب" button on the orders toolbar, plus the two sheets it can end
 * in. A small client island so the orders screen itself stays a server component
 * — the same pattern as `CreateCycleLauncher`.
 *
 * «تأكيد الطلب ووزن الفراخ» books the order and comes straight back here with it,
 * which opens the weighing sheet on it (D-50). That is the counter case: the
 * customer is standing there and the birds are going on the scale now.
 */
export function AddOrderLauncher({
  customers,
  weights,
  defaultCleaning,
  saleOpen,
  salePrice,
  cleaningPrice,
}: {
  customers: CustomerOption[];
  weights: number[];
  defaultCleaning: boolean;
  /** False outside مرحلة البيع. The button still opens — a dead pill explains
   *  nothing, and the sheet is where the reason fits. */
  saleOpen: boolean;
  /** Live settings, for the weighing sheet «تأكيد الطلب ووزن الفراخ» opens. */
  salePrice: number;
  cleaningPrice: number;
}) {
  const [open, setOpen] = useState(false);
  const [weighing, setWeighing] = useState<OrderListItem | null>(null);

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
        onWeigh={setWeighing}
        customers={customers}
        weights={weights}
        defaultCleaning={defaultCleaning}
        saleOpen={saleOpen}
      />

      {/* Held here, not inside the add sheet: that one has already closed by the
          time this opens, and two sheets on the same layer would rank by DOM
          order rather than by intent (T-40). Mounted only once there is an order,
          so its weighing draft is keyed to that order from its first render. */}
      {weighing && (
        <WeighingSheet
          open
          onClose={() => setWeighing(null)}
          order={weighing}
          salePrice={salePrice}
          cleaningPrice={cleaningPrice}
          weights={weights}
        />
      )}
    </>
  );
}
