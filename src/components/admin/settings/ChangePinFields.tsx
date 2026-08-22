"use client";

import { useState, useTransition } from "react";
import {
  BottomSheet,
  CloseButton,
  ConfirmActions,
  DashedAddButton,
  InlineError,
  PinInput,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { changePin } from "@/lib/actions/settings";

/**
 * Change the admin PIN from settings (FR-1ب).
 *
 * Behind a sheet, not a panel that unfolds into the page. It is the one thing on
 * this screen that can lock the admin out of his own farm, and there is no
 * recovery — a forgotten PIN is reset from the database (D-12) — so it does not
 * sit open where a hand over a scale can start typing into it. It used to expand
 * in place, which put three PIN boxes into the middle of a settings list and left
 * «حفظ الاعدادات» hovering over a form it had nothing to do with; the sheet gives
 * it the whole screen and one way out (Khaled, 2026-08-22).
 *
 * The current PIN is asked for and checked server-side inside the same call that
 * writes the new one: a phone left unlocked should not be enough to take the
 * farm. The new one is typed twice, because a PIN gives no second chance to
 * notice a slip — the next login is where you would find out.
 *
 * Saved on its own, never with «حفظ الاعدادات»: nothing else on the screen
 * should ride along with a credential change, and nothing here should be lost if
 * the PIN is refused.
 *
 * Not in the Figma yet — added on request (Khaled, 2026-08-22).
 */
export function ChangePinFields() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function close() {
    if (isSaving) return;
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
    setOpen(false);
  }

  function save() {
    setError(null);
    startSaving(async () => {
      try {
        const result = await changePin(current, next, confirm);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setCurrent("");
        setNext("");
        setConfirm("");
        setOpen(false);
        toast.success("الرقم السري اتغير");
      } catch {
        setError("مفيش اتصال دلوقتي، اتأكد من النت وحاول تاني.");
      }
    });
  }

  return (
    <>
      {/* Dashed while closed, like every other control in the app that opens
          something rather than doing it: an outlined button sits at the weight
          of «حفظ الاعدادات» and reads as part of the form, when this is a door
          (Khaled, 2026-08-22). */}
      <DashedAddButton label="تغيير الرقم السري" onClick={() => setOpen(true)} />

      <BottomSheet
        open={open}
        onClose={close}
        label="تغيير الرقم السري"
        header={
          <div className="flex items-center justify-between gap-2 px-screen pt-4 pb-2">
            <p className="text-h6 font-bold text-heading">تغيير الرقم السري</p>
            <CloseButton onClick={close} size="md" />
          </div>
        }
      >
        <div className="flex flex-col gap-4 px-screen pb-2">
          <p className="text-right text-sm text-heading">
            اكتب رقمك السري الحالي، وبعده الجديد مرتين. لو نسيته مش هينفع نرجّعه.
          </p>

          <Field label="الرقم السري الحالي" id="pin-current">
            <PinInput
              id="pin-current"
              value={current}
              disabled={isSaving}
              onChange={(v) => {
                setCurrent(v);
                if (error) setError(null);
              }}
            />
          </Field>

          <Field label="الرقم السري الجديد" id="pin-new">
            <PinInput
              id="pin-new"
              value={next}
              disabled={isSaving}
              onChange={(v) => {
                setNext(v);
                if (error) setError(null);
              }}
            />
          </Field>

          <Field label="اكتب الجديد تاني" id="pin-confirm">
            <PinInput
              id="pin-confirm"
              value={confirm}
              disabled={isSaving}
              onChange={(v) => {
                setConfirm(v);
                if (error) setError(null);
              }}
            />
          </Field>

          {error && <InlineError message={error} />}

          <ConfirmActions
            confirmLabel="حفظ الرقم الجديد"
            onConfirm={save}
            onCancel={close}
            isLoading={isSaving}
          />
        </div>
      </BottomSheet>
    </>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* The label points at the first box — that is the input `PinInput` gives
          the bare id to, and the one focus lands on. */}
      <label htmlFor={id} className="text-right text-base text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
