"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openingValues, saveDraft } from "@/lib/orderDraft";
import type { OrderForm as OrderFormData } from "@/lib/queries/ordering";
import { revealTop, useSnapToEdges } from "@/hooks/useSnapToEdges";
import { useToast } from "@/hooks/useToast";
import { pluralizeChicken } from "@/lib/format";
import { SALE_CLOSED_CUSTOMER, SOLD_OUT_CUSTOMER } from "@/lib/constants";
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
 * **The two standing states — sold out, sale closed — announce themselves in a
 * toast on arrival** (Khaled, 2026-08-28). They used to sit inline above the
 * confirm bar, in the same red panel the admin gets on A-56, and that was wrong
 * twice over: the panel is an admin pattern — a fault report pinned to the foot
 * of a working screen — and the sentence in it was written for the admin, so it
 * told a customer to «ابدأ مرحلة البيع», which is the one thing he cannot do.
 * See `SALE_CLOSED_CUSTOMER`.
 *
 * The toast lands at the top of the screen, where he is already looking when the
 * page opens, and then leaves — and a message that leaves cannot be the only
 * copy of the reason. So the confirm button is dimmed but still live, and asking
 * it says the same sentence again: `sayWhyBlocked` is the one source, called
 * both on arrival and on every tap. See `ConfirmBar` for why it is
 * `aria-disabled` rather than `disabled`.
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

  // The standing state this screen opened in, so it can be said once and not
  // said again. Held the same way `limitToast` is: React mounts effects twice in
  // development, and `LiveRefresh` can re-render this screen while the sale is
  // still shut — neither should stack a second copy of the same sentence.
  const stateToast = useRef<number | null>(null);

  const soldOut = data.available <= 0;
  const blocked = soldOut || !data.saleOpen;

  // One flick takes the whole screen (Khaled, 2026-08-25) — see the hook. Off
  // once the order is in: the success screen is one screenful and has nothing
  // to snap between.
  useSnapToEdges(!placedOrderId);

  // Why nothing can be ordered — one sentence with one source, said when the
  // screen opens and again on every tap of the button it is about. Sold out
  // first: an empty flock closes the sale on its own (FR-11), so both are true
  // together and only the one that explains why is worth saying.
  const sayWhyBlocked = useCallback(() => {
    if (stateToast.current !== null) toast.dismiss(stateToast.current);
    stateToast.current = toast.warning(
      soldOut ? SOLD_OUT_CUSTOMER : SALE_CLOSED_CUSTOMER,
    );
  }, [soldOut, toast]);

  useEffect(() => {
    if (blocked && !placedOrderId) sayWhyBlocked();
  }, [blocked, placedOrderId, sayWhyBlocked]);

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
        : SOLD_OUT_CUSTOMER,
    );
  }

  if (placedOrderId) return <OrderSuccess orderId={placedOrderId} />;

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
        blocked={blocked}
        onBlockedTap={sayWhyBlocked}
        isSending={sending}
      />
    </div>
  );
}