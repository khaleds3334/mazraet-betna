"use client";

import { useEffect, useRef, useState } from "react";
import { InlineError } from "@/components/ui";
import { openingValues, saveDraft } from "@/lib/orderDraft";
import type { OrderForm as OrderFormData } from "@/lib/queries/ordering";
import { revealTop, useSnapToEdges } from "@/hooks/useSnapToEdges";
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
import { useOrderSubmit, type MissingAnswer } from "./useOrderSubmit";

/**
 * The order form (C-20 → C-25, FR-27) — the customer's side of the same job the
 * admin does on A-56.
 *
 * **Sending it lives in `useOrderSubmit`** — the validation, the toast on
 * failure, and the hen that cackles when it lands.
 *
 * The two standing states — sold out, sale closed — are *not* failures of a tap
 * and stay inline, next to the button they are explaining.
 *
 * The note is folded behind «اضافة ملاحظة», the same dashed control as A-56
 * (Khaled, 2026-08-23) — see `OrderNote`.
 *
 * **The confirm bar comes and goes** — see `ConfirmBar` for the two conditions.
 *
 * **Tapping it with an answer missing does three things, not one** (Khaled,
 * 2026-08-25): the toast says what is missing, the page travels to the question,
 * and a red star goes up beside it. The button lives at the foot of the screen
 * and the counter it is complaining about is a screen away — a sentence on its
 * own leaves him looking for what to fix.
 */
export function OrderForm({ data }: { data: OrderFormData }) {
  const toast = useToast();

  // The question the last tap on «تأكيد الطلب» found unanswered — starred until
  // he answers it, and cleared the moment he does rather than on the next tap.
  const [missing, setMissing] = useState<MissingAnswer | null>(null);
  const countSection = useRef<HTMLDivElement>(null);
  const weightSection = useRef<HTMLDivElement>(null);

  const { submit, sending, placedOrderId } = useOrderSubmit({
    onMissing(answer) {
      setMissing(answer);
      revealTop(
        (answer === "count" ? countSection : weightSection).current,
      );
    },
  });

  // The form opens filled in, not empty (Khaled, 2026-08-25): on the order he
  // is part-way through if he stepped away to another tab, otherwise on what he
  // ordered last time, otherwise on the farm's own suggestion — two kilos and
  // the soonest pickup it can make. A form that starts blank asks this customer
  // four questions he mostly has no opinion on. See `openingValues`.
  const [opening] = useState(() => openingValues(data));

  const [count, setCount] = useState(opening.count);
  const [weight, setWeight] = useState<number | null>(opening.weight);
  const [cleaning, setCleaning] = useState(opening.cleaning);
  const [date, setDate] = useState(opening.date);
  const [time, setTime] = useState(opening.time);
  const [notes, setNotes] = useState(opening.notes);
  // Unfolded if he had written something in it — a restored note hidden behind
  // «اضافة ملاحظة» is a note he would think had been thrown away.
  const [noteOpen, setNoteOpen] = useState(opening.notes.length > 0);

  // The last "that's all there is" is dismissed before the next goes up: a
  // customer presses «+» again to check, and a queue of identical toasts would
  // outlast the screen (same reasoning as the admin's add-order sheet).
  const limitToast = useRef<number | null>(null);

  // One flick takes the whole screen (Khaled, 2026-08-25) — see the hook. Off
  // once the order is in: the success screen is one screenful and has nothing
  // to snap between.
  useSnapToEdges(!placedOrderId);

  // Kept where a tab change cannot reach it. Written on every keystroke rather
  // than on the way out, because there is no "way out" to hook: the tabs unmount
  // this component without asking it anything.
  useEffect(() => {
    saveDraft({ count, weight, cleaning, date, time, notes });
  }, [count, weight, cleaning, date, time, notes]);

  function sayTheLimit() {
    if (limitToast.current !== null) toast.dismiss(limitToast.current);
    limitToast.current = toast.info(
      data.available > 0
        ? `الموجود في المزرعة دلوقتي ${pluralizeChicken(data.available)} بس`
        : "الفراخ خلصت من المزرعة دلوقتي",
    );
  }

  if (placedOrderId) return <OrderSuccess orderId={placedOrderId} />;

  const soldOut = data.available <= 0;

  return (
    <div className="flex flex-1 flex-col gap-1">
      <OrderHeader salePrice={data.salePrice} />

      <div ref={countSection}>
        <CountPicker
          count={count}
          onChange={(next) => {
            setCount(next);
            if (next > 0) setMissing(null);
          }}
          max={data.available}
          onMax={sayTheLimit}
          missing={missing === "count"}
        />
      </div>

      <div ref={weightSection}>
        <WeightPicker
          weights={data.weights}
          weight={weight}
          onWeightChange={(kg) => {
            setWeight(kg);
            setMissing(null);
          }}
          cleaning={cleaning}
          onCleaningChange={setCleaning}
          cleaningPrice={data.cleaningPrice}
          missing={missing === "weight"}
        />
      </div>

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

      {/* Room for the height the nav gains when the confirm bar unfolds into
          it, kept whether or not it is on screen — a padding that came and went
          with it would shift the whole form under a reading thumb. `<main>`
          already clears the nav's own height on top of this. */}
      <div aria-hidden className="h-36 shrink-0" />

      <ConfirmBar
        count={count}
        weight={weight}
        salePrice={data.salePrice}
        cleaning={cleaning}
        cleaningPrice={data.cleaningPrice}
        onConfirm={() => submit({ count, weight, cleaning, date, time, notes })}
        disabled={!data.saleOpen || soldOut}
        isSending={sending}
      />
    </div>
  );
}