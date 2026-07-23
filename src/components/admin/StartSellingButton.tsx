"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { actionBase, actionPrimary } from "@/components/ui/buttonStyles";
import { useToast } from "@/hooks/useToast";
import { startSelling } from "@/lib/actions/cycles";
import { cn } from "@/lib/utils";

const LABEL = "بدء مرحلة البيع";

/**
 * The lime "start selling" button at the foot of the cycle dashboard. It's the
 * shared primary <Button>, and tapping it opens the sale directly (no dialog) via
 * `startSelling`, which flips the cycle into the selling phase. It only enables
 * once the flock reaches selling age (`SALE_READY_MIN_DAY`, 27 days); before that
 * it renders blurred and inert, as the design shows during raising.
 */
export function StartSellingButton({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (!enabled) {
    return (
      <div
        aria-disabled
        className={cn(
          actionBase,
          actionPrimary,
          "pointer-events-none select-none opacity-90 blur-[3px]",
        )}
      >
        {LABEL}
      </div>
    );
  }

  async function onClick() {
    setSubmitting(true);
    const res = await startSelling();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("بدأت مرحلة البيع");
    router.refresh();
  }

  return (
    <Button onClick={onClick} isLoading={submitting}>
      {LABEL}
    </Button>
  );
}
