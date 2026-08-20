"use client";

import { useState } from "react";
import { CloseButton, Icon, InlineError, Modal } from "@/components/ui";

/**
 * The dialog behind both halves of the cancel flow (A-51): confirming a
 * cancellation, and correcting the reason afterwards. One component because the
 * two are the same form — a question, the red reason field, and one red action —
 * and the edit dialog isn't drawn in Figma, so matching the cancel dialog is
 * what makes it feel native.
 *
 * `onConfirm` does the write and returns the result; a failure renders as a
 * persistent inline error and the dialog stays open with the text intact.
 * Cancelling is a critical action (T-09), so this never falls back to a toast.
 */
export function CancelReasonDialog({
  open,
  onClose,
  fieldId,
  question,
  confirmLabel,
  initialReason = "",
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  /** Unique per card — several dialogs share one list. */
  fieldId: string;
  question: string;
  confirmLabel: string;
  initialReason?: string;
  onConfirm: (reason: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [reason, setReason] = useState(initialReason);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError(null);
    setSaving(true);
    const result = await onConfirm(reason);
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "مقدرناش نحفظ، حاول تاني.");
      return;
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={question}
      header={
        <div className="flex items-center justify-between gap-2">
          <p className="text-base text-accent-brown">{question}</p>
          <CloseButton onClick={onClose} size="sm" />
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex flex-col gap-2">
          <label htmlFor={fieldId} className="text-h6 font-bold text-error">
            سبب الغاء الطلب
          </label>
          <input
            id={fieldId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="عدم توفر الاوزان"
            className="border-b-[3px] border-error bg-transparent py-2 text-right text-base text-heading outline-none placeholder:text-disabled-soft"
          />
        </div>

        {error && <InlineError message={error} />}

        {/* Sits at the far end of the row, the way the design places it. */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            aria-busy={saving || undefined}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-error bg-error-surface px-3 text-base text-error disabled:opacity-60"
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-error text-white">
              <Icon name="cancel" size={14} />
            </span>
            <span className="optical-center">{confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
