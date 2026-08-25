"use client";

import Image from "next/image";
import { Icon, Modal } from "@/components/ui";
import { PhoneGlyph, WhatsAppGlyph } from "@/components/shared/ContactGlyphs";
import { whatsappNumber } from "@/lib/phone";

/**
 * «تواصل معنا» — the farm's number, and the two ways to use it (Figma
 * 4146:4683). Opened from the floating pill on the home and the order-details
 * screens, and from «تواصل معنا» in the sidebar; all three show this one dialog.
 *
 * **A `Modal`, not a `BottomSheet`.** The design draws a centred card with the
 * modal shadow — `--shadow-modal` is already that exact value — and `Modal`
 * brings the scrim, the Escape key and the phone's back gesture with it.
 *
 * **The number is the farm's contact number**, resolved the same way the admin's
 * own settings screen resolves it: `contact_phone` when he has set one, the
 * number he signs in with when he has not (`getFarmContactPhone`). One source,
 * so the popup can never quote a number the admin does not recognise.
 *
 * **Latin digits, deliberately.** Rule 3 puts every number in the app in
 * Arabic-Indic and names phone numbers as the one exception: this is a string to
 * be dialled and compared against a contacts list, not a quantity to be read.
 *
 * The four social buttons the design draws under the two are **not built**: the
 * farm has nowhere to store a Facebook or Instagram address, and hard-coding one
 * farm's links into a codebase that has been multi-farm since day one (D-08)
 * would show the wrong farm's page to the second one. They arrive when settings
 * has a home for them (Khaled, 2026-08-25).
 */
export function ContactSheet({
  open,
  onClose,
  phone,
}: {
  open: boolean;
  onClose: () => void;
  /** Null when the farm row could not be read — the popup then says so. */
  phone: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} label="تواصل معنا">
      <div className="flex flex-col gap-3">
        {/* RTL: the first child lands on the RIGHT, so the sentence is written
            first and the close button, on the left, second — which is where the
            design puts it. */}
        <div className="flex items-center justify-between gap-2">
          <p className="flex-1 text-center text-base text-accent-brown">
            تقدر تتواصل معنا في اي وقت لو عندك اي استفسار او سؤال
          </p>

          {/* A 44px tap target around the 24px disc the design draws (rule 8) —
              the disc keeps its size, the area around it does the catching. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="اقفل"
            className="-m-2.5 flex size-11 shrink-0 items-center justify-center"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-error text-white">
              <Icon name="cancel" size={20} />
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-[9px]">
          <div className="flex items-center justify-between gap-2">
            {/* The number and its label on the right, the farmer on the left. */}
            <div className="flex min-w-0 flex-col gap-2 text-right font-bold text-primary-foreground">
              <p className="text-base">رقم التليفون الخاص بنا</p>
              <p className="text-h6" dir="ltr">
                {phone ?? "—"}
              </p>
            </div>

            <Image
              src="/images/contact-img.png"
              alt=""
              width={67}
              height={84}
              className="shrink-0"
            />
          </div>

          {/* «الواتس اب» first so RTL lands it on the RIGHT, «الهاتف» on the
              left — the side each is drawn on. Inside each button the glyph is
              written BEFORE the word for the same reason: the design hangs it on
              the button's right and the word beside it (Khaled, 2026-08-25).

              Both circles are 24px with a 14px mark, as drawn — the design bakes
              the phone's circle into its export and builds the WhatsApp one out
              of 5px of padding around the same 14px.

              `min-h-11` rather than the canvas's 42px: rule 8's floor is 44, and
              these are the two controls the whole popup exists for. Disabled
              outright with no number behind them — a «الهاتف» that opens an empty
              dialler is worse than one that visibly cannot be pressed. */}
          <div className="flex items-stretch justify-center gap-4">
            <a
              href={phone ? `https://wa.me/${whatsappNumber(phone)}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!phone}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md border border-brand bg-brand px-3 py-[9px] text-base text-white aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-brand">
                <WhatsAppGlyph size={14} />
              </span>
              الواتس اب
            </a>

            <a
              href={phone ? `tel:${phone}` : undefined}
              aria-disabled={!phone}
              className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md border border-brand-olive bg-surface-page px-3 py-[9px] text-base text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-foreground">
                <PhoneGlyph size={14} />
              </span>
              الهاتف
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}
