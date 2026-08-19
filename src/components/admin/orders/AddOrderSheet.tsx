"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BottomSheet,
  Button,
  Checkbox,
  CloseButton,
  InlineError,
  InputField,
  Stepper,
  TextareaField,
  Toggle,
  WeightBadge,
} from "@/components/ui";
import { createOrder } from "@/lib/actions/orders";
import type { CustomerOption } from "@/lib/queries/customers";
import { useToast } from "@/hooks/useToast";
import { CustomerPicker } from "./CustomerPicker";

/**
 * "انشاء طلب باسم عميل" (A-56) — a sheet that fills the screen, so it reads as a
 * page while the orders list stays mounted behind it.
 *
 * The admin picks who the order is for, how many birds and at roughly what
 * weight, whether cleaning is included, and any note. One weight covers the whole
 * order; splitting into different weights happens later, on the weighing screen
 * (FR-14ب) — which is what the note field's example hints at.
 */
export function AddOrderSheet({
  open,
  onClose,
  customers,
  weights,
  defaultCleaning,
}: {
  open: boolean;
  onClose: () => void;
  customers: CustomerOption[];
  /** The approximate weights a customer may ask for, from settings (FR-5). */
  weights: number[];
  defaultCleaning: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [orphan, setOrphan] = useState(false);
  const [isHouse, setIsHouse] = useState(false);
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [onBehalfOf, setOnBehalfOf] = useState("");
  const [count, setCount] = useState(1);
  const [cleaning, setCleaning] = useState(defaultCleaning);
  const [weight, setWeight] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setCustomer(null);
    setOrphan(false);
    setIsHouse(false);
    setForSomeoneElse(false);
    setOnBehalfOf("");
    setCount(1);
    setCleaning(defaultCleaning);
    setWeight(null);
    setNotes("");
    setError(null);
  }

  async function submit() {
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
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast.success("تم تسجيل الطلب");
    reset();
    onClose();
    router.refresh();
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label="انشاء طلب باسم عميل"
      size="full"
    >
      <div className="flex min-h-full flex-col gap-6 px-screen pt-4">
        <header className="flex items-center justify-between">
          <h2 className="text-h6 font-bold text-heading">
            انشاء طلب باسم عميل
          </h2>
          <CloseButton onClick={onClose} />
        </header>

        <div className="flex flex-col gap-2.5">
          {/* First, because it changes what the rest of the form means: a house
              order belongs to nobody, so everything about "who" disappears. */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-base text-heading">الطلب ده للبيت</span>
            <Toggle
              checked={isHouse}
              onChange={(checked) => {
                setIsHouse(checked);
                if (checked) {
                  setCustomer(null);
                  setOrphan(false);
                  setForSomeoneElse(false);
                  setOnBehalfOf("");
                }
              }}
              label="الطلب ده للبيت"
            />
          </div>

          {isHouse ? (
            <p className="text-sm text-muted">
              الفراخ دي هتتشال من المتاح زي أي طلب، بس مش هتتحسب في ايراد الدورة
              ولا هتعمل آجل على حد.
            </p>
          ) : (
            <div className="flex flex-col">
              <CustomerPicker
                customers={customers}
                selected={customer}
                onSelect={setCustomer}
                disabled={orphan}
              />

              <div className="flex items-center justify-around gap-2">
                <Checkbox
                  label="لحد تبع العميل؟"
                  checked={forSomeoneElse}
                  onChange={setForSomeoneElse}
                />
                {/* An orphan order has no customer at all (FR-13) — ticking it
                    clears and disables the picker so the two can never disagree. */}
                <Checkbox
                  label="طلب يتيم"
                  checked={orphan}
                  onChange={(checked) => {
                    setOrphan(checked);
                    if (checked) setCustomer(null);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {forSomeoneElse && (
          <InputField
            id="on-behalf-of"
            label="الطلب باسم مين؟"
            value={onBehalfOf}
            onChange={(event) => setOnBehalfOf(event.target.value)}
            placeholder="اسم اللي الفراخ ليه"
          />
        )}

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

        {error && <InlineError message={error} />}

        <div className="mt-auto flex flex-col gap-4 pb-2">
          <Button onClick={submit} isLoading={saving}>
            اكد الطلب
          </Button>
          {/* Saves exactly like the button above until the weighing screen (A-52)
              exists — then this one will save and go straight there. */}
          <Button variant="outline" onClick={submit} disabled={saving}>
            تأكيد الطلب ووزن الفراخ
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
