"use client";

import { useState, useTransition } from "react";
import { Button, InlineError, InputField } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { saveContactPhone } from "@/lib/actions/settings";

/**
 * The number customers ring — not the number the admin signs in with.
 *
 * Saved on its own rather than with «حفظ الاعدادات»: it is the one field on this
 * screen that can be *wrong* rather than merely different, so it needs its own
 * answer. Leaving it empty publishes the login number, which is what the farm
 * already does today; the placeholder says so instead of the field pretending to
 * be unset.
 *
 * Not in the Figma yet — added on request (Khaled, 2026-08-22).
 */
export function ContactPhoneField({
  initial,
  ownerPhone,
  usesOwnerPhone,
}: {
  initial: string;
  /** What customers see today — shown as the placeholder when no number is set. */
  ownerPhone: string;
  usesOwnerPhone: boolean;
}) {
  const toast = useToast();
  const [phone, setPhone] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function save() {
    setError(null);
    startSaving(async () => {
      try {
        const result = await saveContactPhone(phone);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success(phone ? "رقم التواصل اتحفظ" : "رجعنا لرقم الدخول");
      } catch {
        setError("مفيش اتصال دلوقتي، اتأكد من النت وحاول تاني.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 text-right text-heading">
        <p className="text-base">رقم التواصل مع المزرعة</p>
        <p className="text-xs">
          {usesOwnerPhone
            ? "دلوقتي العملاء بيشوفوا رقم دخولك — اكتب رقم تاني لو حابب"
            : "ده الرقم اللي العملاء بيتصلوا بيه، مش رقم دخولك للتطبيق"}
        </p>
      </div>

      <InputField
        id="contact-phone"
        label="رقم التواصل"
        placeholder={ownerPhone}
        inputMode="numeric"
        autoComplete="tel"
        maxLength={11}
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
          if (error) setError(null);
        }}
      />

      {error && <InlineError message={error} />}

      <Button variant="outline" onClick={save} isLoading={isSaving}>
        حفظ رقم التواصل
      </Button>
    </div>
  );
}
