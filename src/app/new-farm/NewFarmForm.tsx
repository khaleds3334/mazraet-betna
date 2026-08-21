"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, InlineError, InputField, PinInput } from "@/components/ui";
import { createTestFarm } from "@/lib/actions/dev-farm";

/** ⚠️ DEV-ONLY — see /app/new-farm/page.tsx. */
export function NewFarmForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function submit() {
    setError(null);
    startSaving(async () => {
      try {
        const result = await createTestFarm(name, phone, pin);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setCreated(result.phone);
      } catch {
        setError("مفيش اتصال دلوقتي، حاول تاني.");
      }
    });
  }

  if (created) {
    return (
      <div className="flex flex-col gap-4 text-right">
        <p className="text-h6 font-bold text-primary-foreground">
          المزرعة اتعملت ✅
        </p>
        <p className="text-base text-heading">
          ادخل برقم <span dir="ltr">{created}</span> والرقم السري اللي كتبته.
          أسعار البيع والتنظيف بصفر — حددها من الإعدادات أول ما تدخل.
        </p>
        <Link href="/login">
          <Button className="w-full">روح لتسجيل الدخول</Button>
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <InputField
        id="farm-name"
        label="اسم المزرعة"
        placeholder="مثال: مزرعة التجربة"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <InputField
        id="farm-phone"
        label="رقم دخول الأدمن"
        placeholder="01012345678"
        inputMode="numeric"
        maxLength={11}
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="farm-pin" className="text-right text-base text-foreground">
          الرقم السري (٦ أرقام)
        </label>
        <PinInput id="farm-pin" value={pin} disabled={isSaving} onChange={setPin} />
      </div>

      {error && <InlineError message={error} />}

      <Button type="submit" isLoading={isSaving}>
        اعمل المزرعة
      </Button>
    </form>
  );
}
