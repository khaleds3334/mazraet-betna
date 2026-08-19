"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ActionButton, BottomSheet, Icon } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

/**
 * The confirm button. Its own component so it can read the form's pending state
 * — the sign-out is in flight until the server answers with a redirect, and a
 * second tap in that window would fire the action twice.
 */
function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <ActionButton
      type="submit"
      variant="danger"
      isLoading={pending}
      className="flex-1"
    >
      {/* Written out rather than passed as ActionButton's `icon` only for the
          size: the design draws it at 16px, the prop renders 20px. It leads the
          word, the way every other ActionButton in the app carries its icon. */}
      <Icon name="logout" size={16} />
      خروج
    </ActionButton>
  );
}

/**
 * «تسجيل الخروج» — the red row and the sheet that asks before it happens
 * (`C-Comp_Logout_Popup`). Shared by the customer sidebar (C-14) and the admin
 * settings screen, so the wording, the door glyph and the behaviour stay one
 * thing in both apps.
 *
 * Confirmation exists because signing out is one tap away from a full stop for
 * these users: the customer is often elderly, and getting back in means typing a
 * phone number again — for the admin, a 6-digit PIN he may not have to hand
 * while standing at the scale.
 *
 * No toast on success: the login screen replacing the app *is* the confirmation,
 * and there is nowhere left to show it.
 */
export function LogoutButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // min-h-11 for the touch-target rule: the row is only as tall as its
        // 24px glyph, and on the settings screen it is an admin control.
        className={cn("flex min-h-11 items-center gap-1 text-error", className)}
      >
        <Icon name="logout" size={24} />
        <span className="text-base font-bold">تسجيل الخروج</span>
      </button>

      <BottomSheet open={open} onClose={close} label="تسجيل الخروج">
        {/* pb-8 on top of the sheet's own bottom padding makes the 56px the
            design leaves under the buttons. */}
        <div className="flex flex-col items-center gap-2 px-screen pt-6 pb-8">
          <Icon name="logout" size={77} className="text-error" />

          <div className="flex w-full flex-col gap-8">
            <div className="flex flex-col gap-4 text-right text-ink">
              <p className="text-h6 font-bold">تسجيل الخروج؟</p>
              <div className="text-lg">
                <p>متأكد إنك عايز تسجّل الخروج دلوقتي؟</p>
                <p>المزرعة بيتك في اي وقت</p>
              </div>
            </div>

            {/* The design gives the two buttons fixed widths that add up to more
                than a 320px screen can hold, so they share the row instead. */}
            <form action={signOut} className="flex items-center gap-3">
              <ConfirmButton />
              <ActionButton
                variant="primary"
                onClick={close}
                className="flex-1"
              >
                الغاء
              </ActionButton>
            </form>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
