"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import type { OrderListItem } from "@/lib/queries/orders";
import { CancelOrderButton } from "./CancelOrderButton";
import { WeighingSheet } from "./weighing/WeighingSheet";

/**
 * The two actions on a pending order card: weigh it, or cancel it.
 *
 * "وزن الفراخ" opens the weighing sheet (A-52) over the list. The order arrives
 * with its weight rows already loaded, so the sheet is on screen the moment the
 * admin taps — he is holding the birds when he does.
 */
export function OrderCardActions({
  order,
  salePrice,
  cleaningPrice,
}: {
  order: OrderListItem;
  salePrice: number;
  cleaningPrice: number;
}) {
  const [weighing, setWeighing] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => setWeighing(true)}
        className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-primary bg-primary px-3 text-base text-foreground"
      >
        <span className="flex size-5 items-center justify-center">
          <Icon name="weight" size={14} />
        </span>
        <span className="optical-center">وزن الفراخ</span>
      </button>

      <CancelOrderButton orderId={order.id} />

      <WeighingSheet
        open={weighing}
        onClose={() => setWeighing(false)}
        order={order}
        salePrice={salePrice}
        cleaningPrice={cleaningPrice}
      />
    </div>
  );
}
