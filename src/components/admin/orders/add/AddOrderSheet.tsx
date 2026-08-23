"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BottomSheet,
  Button,
  CloseButton,
  InlineError,
  Stepper,
  Toggle,
} from "@/components/ui";
import { OrderNote } from "@/components/shared/OrderNote";
import { WeightChoice } from "@/components/shared/WeightChoice";
import { createOrder, fetchOrder } from "@/lib/actions/orders";
import type { CustomerOption } from "@/lib/queries/customers";
import type { OrderListItem } from "@/lib/queries/orders";
import { useToast } from "@/hooks/useToast";
import { pluralizeChicken } from "@/lib/format";
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
 *
 * **The note is folded away behind «اضافة ملاحظة»** — `shared/OrderNote`, the
 * same disclosure the customer's order screen uses (Khaled, 2026-08-21 and
 * 2026-08-23).
 */
export function AddOrderSheet({
  open,
  onClose,
  customers,
  weights,
  defaultCleaning,
  saleOpen,
  available,
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
  /**
   * Birds still free to sell on this cycle (FR-11). The stepper stops here and
   * the form refuses at zero — the flock is finite, and an order for birds that
   * do not exist is one the admin finds out about at the scale, with the
   * customer already standing there.
   */
  available: number;
}) {
  const router = useRouter();
  const toast = useToast();

  const [recipient, setRecipient] = useState<Recipient>(EMPTY_RECIPIENT);
  const [count, setCount] = useState(1);
  const [cleaning, setCleaning] = useState(defaultCleaning);
  const [weight, setWeight] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // «+» stops at what is left of the flock, and a button that just refuses looks
  // broken — so it says why. The last one is dismissed before the next goes up:
  // the admin presses again to check, and five identical toasts queued behind
  // each other would outlast the sheet (Khaled, 2026-08-22).
  const limitToast = useRef<number | null>(null);

  function sayTheLimit() {
    if (limitToast.current !== null) toast.dismiss(limitToast.current);
    limitToast.current = toast.info(
      available > 0
        ? `الفراخ المتوفرة حاليا في المزرعة ${pluralizeChicken(available)}`
        : "مفيش فراخ متاحة في المزرعة دلوقتي",
    );
  }

  function reset() {
    setRecipient(EMPTY_RECIPIENT);
    setCount(1);
    setCleaning(defaultCleaning);
    setWeight(null);
    setNotes("");
    setNoteOpen(false);
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
      <div className="flex flex-col gap-6 px-screen pt-2">
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
            max={available > 0 ? available : 1}
            onMax={sayTheLimit}
          />
        </div>

        <WeightChoice weights={weights} value={weight} onChange={setWeight} />

        <OrderNote
          open={noteOpen}
          onOpenChange={setNoteOpen}
          value={notes}
          onChange={setNotes}
        />

        {/* Said before he fills the form in, not after he taps save — the birds
            are weeks from ready and there is nothing to book (FR-11). */}
        {/* One reason, the real one. An empty flock closes the sale on its own
            (FR-11), so both would otherwise appear at once and the one that
            explains it would be the second. */}
        {available <= 0 ? (
          <InlineError message="مفيش فراخ متاحة في الدورة دي." />
        ) : (
          !saleOpen && <InlineError message={SALE_NOT_OPEN} />
        )}
        {error && <InlineError message={error} />}

        {/* Follows the form instead of being pushed to the foot of the sheet. The
            form used to end in an always-open note box, so `mt-auto` looked like
            spacing; with the note folded away it left a hole above the buttons
            (Khaled, 2026-08-21). `sticky` keeps them reachable when the form is
            long enough to scroll, which is the part `mt-auto` was really for. */}
        <div className="sticky bottom-0 flex flex-col gap-4 bg-background pt-2 pb-2">
          <Button
            onClick={() => submit()}
            disabled={!saleOpen || available <= 0}
            isLoading={saving}
          >
            اكد الطلب
          </Button>
          {/* Same save, then straight onto the scale (D-50). */}
          <Button
            variant="outline"
            onClick={() => submit(true)}
            disabled={saving || !saleOpen || available <= 0}
          >
            تأكيد الطلب ووزن الفراخ
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
