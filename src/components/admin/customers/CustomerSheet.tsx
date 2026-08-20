"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BottomSheet,
  Button,
  CloseButton,
  InlineError,
  InputField,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { addCustomer, updateCustomer } from "@/lib/actions/customers";
import type { CustomerOption } from "@/lib/queries/customers";

/**
 * «تسجيل عميل جديد» (A-34) and «تعديل بيانات العميل» (A-35) — the same two-field
 * sheet, so it's one component. Pass a `customer` and it edits them; leave it out
 * and it registers a new one. Only the title, the button and the starting values
 * differ, which is exactly what the two Figma frames differ by (3281:7204 and
 * 3301:2607).
 *
 * Success shows a toast and closes; failure keeps the sheet open with an inline
 * error, so the message can't vanish before the admin reads it — and whatever he
 * typed is still there to fix.
 */
export function CustomerSheet({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  /** Present = editing this customer · absent = registering a new one. */
  customer?: CustomerOption;
}) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the customer's current details every time the sheet opens (blank for a
  // new one), and clear any error left from the previous attempt. Detected during
  // render rather than in an effect, so the values are there for the opening
  // paint instead of one render late — the same pattern as `CreateCycleSheet`.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(customer?.name ?? "");
      setPhone(customer?.phone ?? "");
      setError(null);
    }
  }

  const editing = customer != null;
  const title = editing ? "تعديل بيانات العميل" : "تسجيل عميل جديد";

  async function submit() {
    setError(null);
    setSubmitting(true);
    const res = editing
      ? await updateCustomer(customer.id, name, phone)
      : await addCustomer(name, phone);
    setSubmitting(false);

    if (!res.ok) return setError(res.error);
    toast.success(editing ? "تم تعديل بيانات العميل" : "تم تسجيل العميل");
    onClose();
    router.refresh();
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label={title}
      header={
        <div className="flex items-center justify-between gap-3 px-screen pt-6">
          <h2 className="text-h6 font-bold text-heading">{title}</h2>
          <CloseButton onClick={onClose} />
        </div>
      }
    >
      <div className="flex flex-col px-screen">
        {/* The design leaves a deliberate gap under the header before the form. */}
        <div className="flex flex-col gap-4 pt-15">
          <InputField
            id="customer-name"
            label="اسم العميل"
            placeholder="أكتب اسمك باللغة العربية"
            autoComplete="name"
            enterKeyHint="next"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError(null);
            }}
          />

          <InputField
            id="customer-phone"
            label="رقم الهاتف"
            placeholder="اكتب رقمك هنا (مثال: 01012345678)"
            inputMode="numeric"
            autoComplete="tel"
            enterKeyHint="done"
            maxLength={11}
            value={phone}
            onChange={(event) => {
              // Digits only, capped at 11 — the same handling as the login field.
              setPhone(event.target.value.replace(/\D/g, "").slice(0, 11));
              if (error) setError(null);
            }}
          />
        </div>

        <div className="flex flex-col gap-4 pt-17">
          {error && <InlineError message={error} />}

          <Button onClick={submit} isLoading={submitting}>
            {editing ? "تعديل" : "حفظ"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
