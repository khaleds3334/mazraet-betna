"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { placeOrder } from "@/lib/actions/customerOrders";
import { clearDraft, type OrderDraft } from "@/lib/orderDraft";
import { useSound } from "@/hooks/useSound";
import { useToast } from "@/hooks/useToast";

/**
 * Sending the order, and everything that happens around it — split out of
 * `OrderForm` so the form is the screen and this is the trip.
 *
 * **Nothing is confirmed twice.** The confirm bar reads the order back and this
 * sends it; there is no "are you sure" in between. The customer here is often
 * elderly, and a dialog asking him to agree to what he just agreed to is a step
 * he can fail at, guarding an action the admin can undo (D-04) on an order that
 * costs nothing until the birds are weighed.
 *
 * A hen cackles when the order lands (Khaled, 2026-08-24) — the one moment on
 * this screen worth hearing from across a room.
 *
 * **A missing answer is not only a toast.** «اختار عدد الفراخ الأول» is said at
 * the foot of the page, and the counter it is about is a screen away — so the
 * caller is told *which* answer is missing (`onMissing`) and carries him to it.
 * A sentence about a control he cannot see is a sentence he cannot act on.
 *
 * **Failures speak through the toast, not an inline error** (Khaled, 2026-08-24)
 * — a deliberate exception to rule 11 / T-09, and the reason it holds up: that
 * rule is written about the admin, who is standing over a scale with his hands
 * busy and may not be looking at the phone when a message flashes. This customer
 * is holding the phone and looking at it, and the inline error had the opposite
 * failure — it rendered at the foot of a long form, below the fold and behind a
 * fixed bar, where it was simply never seen. A message that fades is worse than
 * nothing; a message that never appears is worse still.
 */

/** The answers the form refuses to send without. */
export type MissingAnswer = "count" | "weight";

export function useOrderSubmit({
  onMissing,
}: {
  /** Called instead of sending, with the first answer the order is short of. */
  onMissing: (answer: MissingAnswer) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  // A hen, once, when the order lands. See `useSound` for why it is unlocked on
  // the tap and played a round trip later.
  const cluck = useSound("/sounds/order-success.mp3");

  const [sending, setSending] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  async function submit(order: OrderDraft) {
    // Before any `await` — this is the only moment the browser will grant the
    // sound permission, and it costs nothing if the order then fails.
    cluck.prime();

    if (order.count < 1) {
      toast.error("اختار عدد الفراخ الأول.");
      onMissing("count");
      return;
    }
    if (order.weight == null) {
      toast.error("اختار الوزن المطلوب.");
      onMissing("weight");
      return;
    }
    if (!order.date || !order.time) {
      toast.error("اختار يوم ووقت الاستلام.");
      return;
    }

    setSending(true);
    const result = await placeOrder({
      count: order.count,
      weight: order.weight,
      cleaning: order.cleaning,
      pickupDate: order.date,
      pickupTime: order.time,
      notes: order.notes,
    });
    setSending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    cluck.play();
    // Sent — the next order starts from the farm's suggestion, not from this one.
    clearDraft();
    router.refresh(); // the home badge and the tracking list both count orders
    setPlacedOrderId(result.orderId);
  }

  return { submit, sending, placedOrderId };
}
