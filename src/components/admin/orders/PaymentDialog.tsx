"use client";

import { useState } from "react";
import { CardAction, CloseButton, InlineError, Modal } from "@/components/ui";
import { formatCurrency, toArabicDigits, toLatinDigits } from "@/lib/format";
import { ORPHAN_MUST_BE_PAID } from "@/lib/constants";

/**
 * "المبلغ اللي تم دفعه" (A-62) — what the customer handed over, taken at the
 * moment the birds change hands, and again from the invoice later.
 *
 * Two answers, both of them final: «دفع» records the number in the box, and «لم
 * يدفع» records nothing. There is no third button, because "he'll pay later" and
 * "he paid nothing" are the same fact — the remainder becomes his debt either
 * way (FR-17), and payment can go on in instalments after this.
 *
 * The box opens on the full amount owed, since that is what usually happens; the
 * admin edits it down when it isn't. It can't be edited *up*: paying more than
 * is owed is a typo, not a transaction.
 *
 * `onConfirm` does the write and returns its result. Money is a critical action,
 * so a failure stays on screen as an inline error and the dialog keeps the
 * number the admin typed (rule 11) — never a toast that fades while he counts.
 *
 * `requireFull` is the one case where "he'll pay later" isn't available: an order
 * with no customer on it has nobody to owe the money afterwards (D-42), so the
 * dialog says so and both partial payment and «لم يدفع» are refused.
 */
export function PaymentDialog({
  open,
  onClose,
  amountDue,
  requireFull = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  /** What is still owed on this order — the ceiling, and the opening value. */
  amountDue: number;
  /** True for an orphan order: it can only be handed over paid in full. */
  requireFull?: boolean;
  onConfirm: (amount: number) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [amount, setAmount] = useState(amountDue);
  const [error, setError] = useState<string | null>(null);
  /** Which button is running — so the spinner appears under the finger. */
  const [saving, setSaving] = useState<"paid" | "unpaid" | null>(null);

  // Every opening starts on the full amount owed — which may have moved while
  // the dialog sat closed, since the card behind it refreshes. Adjusted as the
  // dialog opens rather than in an effect, so the box never shows a stale number
  // for a frame first (React's "adjusting state when a prop changes").
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setAmount(amountDue);
  }

  async function submit(paid: number) {
    setError(null);
    setSaving(paid > 0 ? "paid" : "unpaid");
    const result = await onConfirm(paid);
    setSaving(null);

    if (!result.ok) {
      setError(result.error ?? "مقدرناش نسجّل الدفع، حاول تاني.");
      return;
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="تسجيل الدفع"
      header={
        <div className="flex items-center justify-between gap-2">
          <p className="text-base text-accent-brown">
            المبلغ المطلوب: {formatCurrency(amountDue)}
          </p>
          <CloseButton onClick={onClose} size="sm" />
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex flex-col items-center gap-2">
          <label
            htmlFor="paid-amount"
            className="w-full text-right text-h6 font-bold text-brand"
          >
            المبلغ اللي تم دفعه
          </label>
          <input
            id="paid-amount"
            inputMode="numeric"
            value={toArabicDigits(amount)}
            onChange={(event) => {
              const digits = toLatinDigits(event.target.value);
              setAmount(Math.min(amountDue, digits === "" ? 0 : Number(digits)));
            }}
            onFocus={(event) => event.target.select()}
            className="w-50 border-b-[3px] border-brand bg-transparent py-2 text-center text-h6 font-bold text-brand outline-none"
          />
        </div>

        {requireFull && <InlineError message={ORPHAN_MUST_BE_PAID} />}
        {error && <InlineError message={error} />}

        {/* «دفع» first so it lands on the right, where the design puts it. */}
        <div className="flex items-center gap-4">
          <CardAction
            variant="brand"
            icon="walletAdd"
            grow
            onClick={() => submit(amount)}
            isLoading={saving === "paid"}
            disabled={saving !== null || (requireFull && amount < amountDue)}
          >
            دفع
          </CardAction>
          <CardAction
            variant="muted"
            onClick={() => submit(0)}
            isLoading={saving === "unpaid"}
            disabled={saving !== null || requireFull}
          >
            لم يدفع
          </CardAction>
        </div>
      </div>
    </Modal>
  );
}
