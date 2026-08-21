"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  CloseButton,
  ConfirmActions,
  InlineError,
  Modal,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { endCycle } from "@/lib/actions/cycles";
import { pluralizeChicken, pluralizeOrder } from "@/lib/format";

const LABEL = "انتهاء فترة البيع";

/**
 * «انتهاء فترة البيع» at the foot of the selling cycle's row (A-44), plus its
 * confirm dialog. This is the one action that closes a cycle: the flock is sold,
 * the cycle becomes history, and the farm is free to register the next one.
 *
 * It asks first, because there is no undo — the design draws no dialog for it, so
 * this borrows the shape of the one that opens the sale (A-23), which is the same
 * question in the other direction.
 *
 * **Two things block it,** and the dialog names whichever applies before he
 * commits — the action checks both again on the server, since the numbers this
 * screen rendered with can be minutes old:
 *
 *   • **an open order** (D-36) — a cycle that closes over an order still being
 *     weighed strands it in history, where the orders screen no longer looks;
 *   • **a bird nobody has taken** (D-49) — closing over unsold stock walks the
 *     flock into history with it.
 *
 * Only one message shows at a time, and orders come first: they are the reason he
 * can act on right now, and clearing them is often what empties the flock anyway.
 *
 * Failure is an inline error, never a toast (T-09): ending a cycle is critical,
 * and a toast that auto-dismisses unseen would leave him believing it closed.
 */
export function EndSellingButton({
  openOrders,
  availableChickens,
}: {
  openOrders: number;
  /** Birds still free to sell — «الفراخ المتوفرة» on the selling dashboard. */
  availableChickens: number;
}) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Orders first: clearing them is often what empties the flock too, so leading
  // with the birds would send him to fix the second thing first.
  const blockedReason =
    openOrders > 0
      ? `فيه ${pluralizeOrder(openOrders)} لسه مفتوحة في الدورة، خلّصها الأول.`
      : availableChickens > 0
        ? `لسه فيه ${pluralizeChicken(availableChickens)} متوفرة في الدورة، بيعها او سجّلها نافق الأول.`
        : null;

  function close() {
    setOpen(false);
    setError(null);
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    const result = await endCycle();
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("تم انهاء الدورة");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>{LABEL}</Button>

      <Modal
        open={open}
        onClose={close}
        label="تأكيد انهاء الدورة"
        header={
          /* Question on the right, close on the left (app convention). */
          <div className="flex items-center justify-between gap-2">
            <p className="text-accent-brown">هل انت متأكد من انهاء الدورة ؟</p>
            <CloseButton onClick={close} size="sm" />
          </div>
        }
      >
        <div className="flex flex-col gap-5 pt-5">
          <p className="text-right text-lg text-heading">
            الدورة هتتقفل ومش هتقدر ترجع فيها، وهتلاقيها في قائمة الدورات بربحها
            النهائي.
          </p>

          {blockedReason && <InlineError message={blockedReason} />}
          {error && <InlineError message={error} />}

          <ConfirmActions
            confirmLabel="انهاء الدورة"
            onConfirm={submit}
            onCancel={close}
            isLoading={submitting}
            disabled={blockedReason !== null}
          />
        </div>
      </Modal>
    </>
  );
}
