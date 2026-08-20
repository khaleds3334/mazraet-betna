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
import { pluralizeOrder } from "@/lib/format";

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
 * **Open orders block it** (D-36): a cycle that closes over an order still being
 * weighed strands that order in history, where the orders screen no longer looks.
 * The count is shown in the dialog before he commits, and the action checks again
 * on the server — the number this screen rendered with can be minutes old.
 *
 * Failure is an inline error, never a toast (T-09): ending a cycle is critical,
 * and a toast that auto-dismisses unseen would leave him believing it closed.
 */
export function EndSellingButton({ openOrders }: { openOrders: number }) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = openOrders > 0;

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

          {blocked && (
            <InlineError
              message={`فيه ${pluralizeOrder(openOrders)} لسه مفتوحة في الدورة، خلّصها الأول.`}
            />
          )}
          {error && <InlineError message={error} />}

          <ConfirmActions
            confirmLabel="انهاء الدورة"
            onConfirm={submit}
            onCancel={close}
            isLoading={submitting}
            disabled={blocked}
          />
        </div>
      </Modal>
    </>
  );
}
