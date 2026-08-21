"use client";

import { useState, useTransition } from "react";
import { Button, InlineError, InputField, PinInput } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { changeLoginPhone } from "@/lib/actions/settings";

/**
 * Change the number the admin signs in with (FR-1).
 *
 * Collapsed, and guarded by the PIN, for the same reason the PIN itself is: this
 * is the credential to the whole farm. Getting it wrong by hand — moving
 * `owner_phone` without moving the auth account it derives — locks the owner out
 * with no way back except the database, which is exactly what this exists to
 * stop him having to do.
 *
 * The warning is not decoration. Everything else on this screen can be undone
 * from this screen; this one changes how he gets back to it.
 *
 * Not in the Figma — added on request (Khaled, 2026-08-22).
 */
export function ChangeLoginPhoneFields({ current }: { current: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function close() {
    setPhone("");
    setPin("");
    setError(null);
    setOpen(false);
  }

  function save() {
    setError(null);
    startSaving(async () => {
      try {
        const result = await changeLoginPhone(phone, pin);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        close();
        toast.success("رقم الدخول اتغير — استخدمه المرة الجاية");
      } catch {
        setError("مفيش اتصال دلوقتي، اتأكد من النت وحاول تاني.");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        تغيير رقم الدخول
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 text-right text-heading">
        <p className="text-base">تغيير رقم الدخول</p>
        <p className="text-xs">
          ده الرقم اللي بتدخل بيه التطبيق. رقمك الحالي {current}
        </p>
      </div>

      <div className="rounded-2xl bg-warning-surface px-4 py-3 text-right text-sm text-heading">
        بعد ما تغيّره مش هتقدر تدخل بالرقم القديم. الرقم السري بتاعك مش هيتغير.
      </div>

      <InputField
        id="login-phone"
        label="رقم الدخول الجديد"
        placeholder="اكتب الرقم الجديد"
        inputMode="numeric"
        autoComplete="tel"
        maxLength={11}
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
          if (error) setError(null);
        }}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="login-phone-pin" className="text-right text-base text-foreground">
          اكتب رقمك السري عشان نتأكد إنه انت
        </label>
        <PinInput
          id="login-phone-pin"
          value={pin}
          disabled={isSaving}
          onChange={(v) => {
            setPin(v);
            if (error) setError(null);
          }}
        />
      </div>

      {error && <InlineError message={error} />}

      <div className="flex gap-3">
        <Button onClick={save} isLoading={isSaving} className="flex-1">
          غيّر الرقم
        </Button>
        <Button variant="outline" onClick={close} className="flex-1">
          إلغاء
        </Button>
      </div>
    </div>
  );
}
