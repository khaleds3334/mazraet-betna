"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, InputField } from "@/components/ui";
import { registerCustomer } from "@/lib/actions/auth";

/**
 * Name entry for a new customer. On success the customer is created, signed in,
 * and sent into the app. Validation + failures render inline under the field.
 */
export function RegisterForm({ phone }: { phone: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);

    startTransition(async () => {
      try {
        const result = await registerCustomer(phone, name);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.replace("/");
        router.refresh();
      } catch {
        setError("مفيش اتصال دلوقتي، اتأكد من النت وحاول تاني.");
      }
    });
  }

  return (
    <form
      noValidate
      className="flex w-full flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <InputField
        id="name"
        name="name"
        label="اسم حضرتك"
        placeholder="أكتب اسمك باللغة العربية"
        autoComplete="name"
        enterKeyHint="go"
        value={name}
        error={error}
        onChange={(e) => {
          setName(e.target.value);
          if (error) setError(null);
        }}
      />

      <Button type="submit" isLoading={isPending}>
        متابعة
      </Button>
    </form>
  );
}
