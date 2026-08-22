"use client";

import { InputField } from "@/components/ui";

/**
 * The number customers ring — not the number the admin signs in with.
 *
 * Saved by «حفظ الاعدادات» with everything else on the screen. It had its own
 * «حفظ رقم التواصل» button, on the reasoning that a phone number can be *wrong*
 * rather than merely different and deserves its own answer — but a second save
 * button on a screen that already has one asks the admin which of the two he
 * needs, every time, for a field that is refused the same way the prices are
 * (Khaled, 2026-08-22). One button saves the screen.
 *
 * Leaving it empty publishes the login number, which is what the farm already
 * does today; the placeholder says so instead of the field pretending to be
 * unset.
 *
 * Not in the Figma yet — added on request (Khaled, 2026-08-22).
 */
export function ContactPhoneField({
  value,
  onChange,
  ownerPhone,
  usesOwnerPhone,
}: {
  value: string;
  onChange: (phone: string) => void;
  /** What customers see today — shown as the placeholder when no number is set. */
  ownerPhone: string;
  usesOwnerPhone: boolean;
}) {
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
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 11))}
      />
    </div>
  );
}
