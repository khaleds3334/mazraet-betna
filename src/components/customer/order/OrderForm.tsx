"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InlineError } from "@/components/ui";
import { placeOrder } from "@/lib/actions/customerOrders";
import type { OrderForm as OrderFormData } from "@/lib/queries/ordering";
import { useSound } from "@/hooks/useSound";
import { useToast } from "@/hooks/useToast";
import { pluralizeChicken } from "@/lib/format";
import { SALE_NOT_OPEN } from "@/lib/constants";
import { OrderNote } from "@/components/shared/OrderNote";
import { ConfirmBar } from "./ConfirmBar";
import { CountPicker } from "./CountPicker";
import { OrderHeader } from "./OrderHeader";
import { OrderSuccess } from "./OrderSuccess";
import { PickupPicker } from "./PickupPicker";
import { WeightPicker } from "./WeightPicker";

/**
 * The order form (C-20 → C-25, FR-27) — the customer's side of the same job the
 * admin does on A-56.
 *
 * **Nothing is confirmed twice.** The confirm bar reads the order back and the
 * button sends it; there is no "are you sure" in between. The customer here is
 * often elderly, and a dialog asking him to agree to what he just agreed to is a
 * step he can fail at, guarding an action the admin can undo (D-04) on an order
 * that costs nothing until the birds are weighed.
 *
 * A hen cackles when the order lands (Khaled, 2026-08-24) — the one moment on
 * this screen worth hearing from across a room.
 *
 * **Failures speak through the toast, not an inline error** (Khaled, 2026-08-24)
 * — a deliberate exception to rule 11 / T-09, and the reason it holds up: that
 * rule is written about the admin, who is standing over a scale with his hands
 * busy and may not be looking at the phone when a message flashes. This customer
 * is holding the phone and looking at it, and the inline error had the opposite
 * failure — it rendered at the foot of a long form, below the fold and behind a
 * fixed bar, where it was simply never seen. A message that fades is worse than
 * nothing; a message that never appears is worse still.
 *
 * The two standing states — sold out, sale closed — are *not* failures of a tap
 * and stay inline, next to the button they are explaining.
 *
 * The note is folded behind «اضافة ملاحظة», the same dashed control as A-56
 * (Khaled, 2026-08-23) — see `OrderNote`.
 *
 * **The confirm bar comes and goes** — see `ConfirmBar` for the two conditions.
 */
export function OrderForm({ data }: { data: OrderFormData }) {
  const router = useRouter();
  const toast = useToast();
  // A hen, once, when the order lands. See `useSound` for why it is unlocked on
  // the tap and played a round trip later.
  const cluck = useSound("/sounds/order-success.mp3");

  const [count, setCount] = useState(0);
  const [weight, setWeight] = useState<number | null>(null);
  const [cleaning, setCleaning] = useState(data.defaultCleaning);
  // Opens on the soonest pickup the farm can make — today and its next slot, or
  // tomorrow's first once tonight is done (`defaultPickup`). A form that starts
  // empty asks this customer to answer a question he mostly has no opinion on.
  const [date, setDate] = useState(data.defaultDate);
  const [time, setTime] = useState(data.defaultTime);
  const [notes, setNotes] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // The last "that's all there is" is dismissed before the next goes up: a
  // customer presses «+» again to check, and a queue of identical toasts would
  // outlast the screen (same reasoning as the admin's add-order sheet).
  const limitToast = useRef<number | null>(null);

  function sayTheLimit() {
    if (limitToast.current !== null) toast.dismiss(limitToast.current);
    limitToast.current = toast.info(
      data.available > 0
        ? `الموجود في المزرعة دلوقتي ${pluralizeChicken(data.available)} بس`
        : "الفراخ خلصت من المزرعة دلوقتي",
    );
  }

  async function submit() {
    // Before any `await` — this is the only moment the browser will grant the
    // sound permission, and it costs nothing if the order then fails.
    cluck.prime();

    if (count < 1) {
      toast.error("اختار عدد الفراخ الأول.");
      return;
    }
    if (weight == null) {
      toast.error("اختار الوزن المطلوب.");
      return;
    }
    if (!date || !time) {
      toast.error("اختار يوم ووقت الاستلام.");
      return;
    }

    setSending(true);
    const result = await placeOrder({
      count,
      weight,
      cleaning,
      pickupDate: date,
      pickupTime: time,
      notes,
    });

    if (!result.ok) {
      setSending(false);
      toast.error(result.error);
      return;
    }

    setSending(false);
    cluck.play();
    router.refresh(); // the home badge and the tracking list both count orders
    setPlacedOrderId(result.orderId);
  }

  if (placedOrderId) return <OrderSuccess orderId={placedOrderId} />;

  const soldOut = data.available <= 0;

  return (
    <div className="flex flex-1 flex-col gap-1">
      <OrderHeader salePrice={data.salePrice} />

      <CountPicker
        count={count}
        onChange={setCount}
        max={data.available}
        onMax={sayTheLimit}
      />

      <WeightPicker
        weights={data.weights}
        weight={weight}
        onWeightChange={setWeight}
        cleaning={cleaning}
        onCleaningChange={setCleaning}
        cleaningPrice={data.cleaningPrice}
      />

      <PickupPicker
        days={data.days}
        slots={data.slots}
        date={date}
        time={time}
        onDateChange={setDate}
        onTimeChange={setTime}
      />

      <OrderNote
        open={noteOpen}
        onOpenChange={setNoteOpen}
        value={notes}
        onChange={setNotes}
        label="لو عندك اي ملاحظة اكتبها هنا"
        addLabel="اضافة ملاحظة علي الطلب"
        className="mx-4 px-screen py-4"
      />

      <p className="px-screen pb-2 text-center text-h6 font-bold text-accent-brown">
        <span className="text-h3 text-error-soft">*</span>
        سيتم حساب السعر النهائي و اصدار الفاتورة النهائية بعد وزن الفراخ
      </p>

      {/* A standing state, not the result of a tap — so it stays on the screen
          rather than passing through a toast. Said before the form is filled in,
          not after it is sent. One reason, the real one: an empty flock closes
          the sale on its own (FR-11), so both would otherwise appear together and
          the explaining one would be second. */}
      <div className="flex flex-col gap-2 px-screen">
        {soldOut ? (
          <InlineError message="الفراخ خلصت من المزرعة دلوقتي." />
        ) : (
          !data.saleOpen && <InlineError message={SALE_NOT_OPEN} />
        )}
      </div>

      {/* Room for the confirm bar, kept whether or not it is on screen — a
          padding that came and went with it would shift the whole form under a
          reading thumb. */}
      <div aria-hidden className="h-50 shrink-0" />

      <ConfirmBar
        count={count}
        weight={weight}
        onConfirm={submit}
        disabled={!data.saleOpen || soldOut}
        isSending={sending}
      />
    </div>
  );
}