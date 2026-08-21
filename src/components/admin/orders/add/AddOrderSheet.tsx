"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BottomSheet,
  Button,
  CloseButton,
  InlineError,
  Stepper,
  TextareaField,
  Toggle,
  WeightBadge,
} from "@/components/ui";
import { createOrder, fetchOrder } from "@/lib/actions/orders";
import type { CustomerOption } from "@/lib/queries/customers";
import type { OrderListItem } from "@/lib/queries/orders";
import { useToast } from "@/hooks/useToast";
import { SALE_NOT_OPEN } from "@/lib/constants";
import {
  EMPTY_RECIPIENT,
  OrderRecipient,
  type Recipient,
} from "./OrderRecipient";

/**
 * "انشاء طلب باسم عميل" (A-56) — a sheet that fills the screen, so it reads as a
 * page while the orders list stays mounted behind it.
 *
 * The admin picks who the order is for, how many birds and at roughly what
 * weight, whether cleaning is included, and any note. One weight covers the whole
 * order; splitting into different weights happens later, on the weighing screen
 * (FR-14ب) — which is what the note field's example hints at.
 *
 * **Two ways out, one save.** «اكد الطلب» books it and closes. «تأكيد الطلب ووزن
 * الفراخ» books the same order and hands it straight to the weighing sheet
 * (D-50) — the customer standing at the counter with his birds, which is the
 * common case for an order the admin types himself. The order is fetched back
 * after the save rather than assembled here: the weighing sheet reads a whole
 * `OrderListItem`, and one made up client-side would be a second, quietly
 * different definition of an order.
 *
 * The form is only cleared once the save lands. A failed save keeps every field,
 * because the alternative is retyping an order in front of a waiting customer.
 */
export function AddOrderSheet({
  open,
  onClose,
  customers,
  weights,
  defaultCleaning,
  saleOpen,
  onWeigh,
}: {
  open: boolean;
  onClose: () => void;
  /** Hands the freshly booked order to the weighing sheet (A-52). */
  onWeigh: (order: OrderListItem) => void;
  customers: CustomerOption[];
  /** The approximate weights a customer may ask for, from settings (FR-5). */
  weights: number[];
  defaultCleaning: boolean;
  /** False outside مرحلة البيع — the form says so and refuses to save. */
  saleOpen: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [recipient, setRecipient] = useState<Recipient>(EMPTY_RECIPIENT);
  const [count, setCount] = useState(1);
  const [cleaning, setCleaning] = useState(defaultCleaning);
  const [weight, setWeight] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setRecipient(EMPTY_RECIPIENT);
    setCount(1);
    setCleaning(defaultCleaning);
    setWeight(null);
    setNotes("");
    setError(null);
  }

  async function submit(thenWeigh = false) {
    const { isHouse, orphan, customer, forSomeoneElse, onBehalfOf } = recipient;

    if (!isHouse && !orphan && !customer) {
      setError("اختار العميل، او علّم إن الطلب يتيم.");
      return;
    }
    if (forSomeoneElse && !onBehalfOf.trim()) {
      setError("اكتب الطلب باسم مين.");
      return;
    }
    if (weight == null) {
      setError("اختار الوزن المطلوب.");
      return;
    }

    setError(null);
    setSaving(true);
    const result = await createOrder({
      customerId: orphan ? null : (customer?.id ?? null),
      onBehalfOf: forSomeoneElse ? onBehalfOf : "",
      count,
      weight,
      cleaning,
      notes,
      isHouse,
    });

    if (!result.ok) {
      setSaving(false);
      setError(result.error);
      return;
    }

    // Read the saved order back before closing anything. If this fails the order
    // is still booked — say so and close, rather than leave him on a form whose
    // save already went through and invite him to send it twice.
    const order = result.orderId && thenWeigh
      ? await fetchOrder(result.orderId)
      : null;
    setSaving(false);

    toast.success("تم تسجيل الطلب");
    reset();
    onClose();
    router.refresh();

    if (order) onWeigh(order);
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label="انشاء طلب باسم عميل"
      size="full"
      header={
        <div className="flex items-center justify-between px-screen pt-4 pb-2">
          <h2 className="text-h6 font-bold text-heading">
            انشاء طلب باسم عميل
          </h2>
          <CloseButton onClick={onClose} />
        </div>
      }
    >
      <div className="flex min-h-full flex-col gap-6 px-screen pt-2">
        <OrderRecipient
          value={recipient}
          onChange={setRecipient}
          customers={customers}
          autoFocus={open}
        />

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-base text-heading">محتاج كام فرخة؟</span>
            <div className="flex min-h-11 items-center gap-2.5">
              <span className="text-base text-heading">التنظيف</span>
              <Toggle
                checked={cleaning}
                onChange={setCleaning}
                label="التنظيف"
              />
            </div>
          </div>
          <Stepper
            value={count}
            onChange={setCount}
            label="عدد الفراخ"
            min={1}
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-right text-base text-heading">
            اختار الوزن المطلوب في حدود كام بالكجم؟
          </p>
          <div
            role="radiogroup"
            aria-label="الوزن المطلوب"
            className="no-scrollbar flex items-center justify-between overflow-x-auto"
          >
            {weights.map((option) => (
              <WeightBadge
                key={option}
                weight={option}
                selected={weight === option}
                onSelect={() => setWeight(option)}
              />
            ))}
          </div>
        </div>

        <TextareaField
          id="order-notes"
          label="اي ملاحظات"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="مثلا: عاوز فرختين لوحدهم و ٣ لوحدهم..."
        />

        {/* Said before he fills the form in, not after he taps save — the birds
            are weeks from ready and there is nothing to book (FR-11). */}
        {!saleOpen && <InlineError message={SALE_NOT_OPEN} />}
        {error && <InlineError message={error} />}

        <div className="mt-auto flex flex-col gap-4 pb-2">
          <Button
            onClick={() => submit()}
            disabled={!saleOpen}
            isLoading={saving}
          >
            اكد الطلب
          </Button>
          {/* Same save, then straight onto the scale (D-50). */}
          <Button
            variant="outline"
            onClick={() => submit(true)}
            disabled={saving || !saleOpen}
          >
            تأكيد الطلب ووزن الفراخ
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
