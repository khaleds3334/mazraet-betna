"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  CloseButton,
  ConfirmActions,
  InlineError,
  Modal,
  Stepper,
} from "@/components/ui";
import { actionBase, actionPrimary } from "@/components/ui/buttonStyles";
import { useToast } from "@/hooks/useToast";
import { startSelling } from "@/lib/actions/cycles";
import { cn } from "@/lib/utils";

const LABEL = "بدء مرحلة البيع";

/**
 * The lime "start selling" button at the foot of the raising dashboard, plus its
 * confirm dialog (node 3608:3838). The dialog does two things at once: it asks
 * the admin to confirm, and it captures the kilo price the cycle will sell at —
 * opening the sale without setting the price is the mistake it exists to prevent.
 *
 * The button only enables once the flock reaches selling age (`SALE_READY_MIN_DAY`,
 * 27 days); before that it renders blurred and inert, as the design shows.
 *
 * Failure uses an inline error inside the dialog, not a toast: opening the sale
 * is visible to every customer, and a toast that auto-dismisses unseen would
 * leave the admin waiting for orders that can never arrive (T-09).
 */
export function StartSellingButton({
  enabled,
  salePrice,
}: {
  enabled: boolean;
  /** Current kilo price from settings — what the dialog opens on. */
  salePrice: number;
}) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(salePrice);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function close() {
    setOpen(false);
    setError(null);
    setPrice(salePrice); // reopening starts from the saved price again
  }

  async function submit() {
    setError(null);
    if (price <= 0) {
      setError("اكتب سعر كيلو الفراخ الأول.");
      return;
    }
    setSubmitting(true);
    const res = await startSelling(price);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success("بدأت مرحلة البيع");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>{LABEL}</Button>

      <Modal
        open={open}
        onClose={close}
        label="تأكيد بدء البيع"
        header={
          /* Title on the right, close on the left (app convention). */
          <div className="flex items-center justify-between">
            <p className="text-accent-brown">هل انت متأكد من بدء البيع ؟</p>
            <CloseButton onClick={close} size="sm" />
          </div>
        }
      >
        <div className="flex flex-col gap-5 pt-5">
          <div className="flex flex-col gap-5">
            <p className="w-full text-right text-heading">سعر كيلو الفراخ؟</p>
            <Stepper
              label="سعر كيلو الفراخ"
              value={price}
              onChange={setPrice}
            />
          </div>

          {error && <InlineError message={error} />}

          <ConfirmActions
            confirmLabel="بدء البيع"
            onConfirm={submit}
            onCancel={close}
            isLoading={submitting}
          />
        </div>
      </Modal>
    </>
  );
}
