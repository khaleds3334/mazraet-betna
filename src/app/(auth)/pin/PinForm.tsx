"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, PinInput } from "@/components/ui";
import { verifyPin } from "@/lib/actions/auth";

const PIN_LENGTH = 6;

/**
 * The admin's 6-digit PIN entry. Submits automatically the moment the 6th digit
 * is typed — no need to also tap "دخول". A wrong PIN turns the boxes red with a
 * message above the button; on success the admin is signed in and sent in.
 */
export function PinForm({ phone }: { phone: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(pinValue: string) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await verifyPin(phone, pinValue);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.replace("/admin");
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
        submit(pin);
      }}
    >
      <PinInput
        id="pin"
        value={pin}
        error={Boolean(error)}
        disabled={isPending}
        autoFocus
        describedBy={error ? "pin-error" : undefined}
        onChange={(value) => {
          setPin(value);
          if (error) setError(null);
          if (value.length === PIN_LENGTH) submit(value);
        }}
      />

      <div className="flex flex-col gap-3">
        {error && (
          <p id="pin-error" className="text-center text-sm text-error">
            {error}
          </p>
        )}
        <Button type="submit" isLoading={isPending}>
          دخول
        </Button>
      </div>
    </form>
  );
}
