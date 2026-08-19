"use client";

import { useState } from "react";
import { CardAction } from "@/components/ui";
import type { OrderListItem } from "@/lib/queries/orders";
import { CancelOrderButton } from "./CancelOrderButton";
import { WeighingSheet } from "../weighing/WeighingSheet";

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
  weights,
}: {
  order: OrderListItem;
  salePrice: number;
  cleaningPrice: number;
  weights: number[];
}) {
  const [weighing, setWeighing] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <CardAction icon="weight" grow onClick={() => setWeighing(true)}>
        وزن الفراخ
      </CardAction>

      <CancelOrderButton orderId={order.id} />

      <WeighingSheet
        open={weighing}
        onClose={() => setWeighing(false)}
        order={order}
        salePrice={salePrice}
        cleaningPrice={cleaningPrice}
        weights={weights}
      />
    </div>
  );
}
