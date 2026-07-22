"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, InputField } from "@/components/ui";
import { startLogin } from "@/lib/actions/auth";

/**
 * The interactive part of the login screen: phone entry + submit.
 * Phone digits stay Latin (the one exception to Arabic-Indic, FR-3); everything
 * else is Arabic. Errors render inline under the field, matching the design.
 */
export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await startLogin(phone);

        if (!result.ok) {
          setError(result.error);
          return;
        }

        if (result.next === "pin") {
          router.push(`/pin?phone=${result.phone}`);
        } else if (result.next === "register") {
          router.push(`/register?phone=${result.phone}`);
        } else {
          router.replace("/");
          router.refresh();
        }
      } catch {
        // Network/connection failure (e.g. the phone dropping the request).
        setError("مفيش اتصال دلوقتي، اتأكد من النت وحاول تاني.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6" noValidate>
      <InputField
        id="phone"
        name="phone"
        label="رقم الهاتف"
        placeholder="اكتب رقمك هنا (مثال: 01012345678)"
        inputMode="numeric"
        autoComplete="tel"
        enterKeyHint="go"
        maxLength={11}
        value={phone}
        error={error}
        onChange={(e) => {
          setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
          if (error) setError(null);
        }}
      />

      <Button type="submit" isLoading={isPending}>
        دخول
      </Button>
    </form>
  );
}
