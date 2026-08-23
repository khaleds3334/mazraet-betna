"use client";

import { DashedAddButton, Icon, TextareaField } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Long enough for the keyboard to finish opening and the viewport to settle. */
const KEYBOARD_SETTLE_MS = 350;

/**
 * The optional note on an order, folded behind a dashed «اضافة ملاحظة» button.
 *
 * Both apps take this note and both fold it the same way — the customer on the
 * order screen (C-20) and the admin on «انشاء طلب باسم عميل» (A-56) — so it
 * lives in `shared` rather than being written out twice (Khaled, 2026-08-23).
 * Only the wording differs, which is what the props are for.
 *
 * **A disclosure, not a checkbox.** A checkbox records an answer; this records
 * nothing, it decides whether a field is on screen. Most orders have nothing to
 * say, and three empty lines open for all of them push the buttons off a short
 * screen.
 *
 * **Closing it clears what was typed**, on purpose: a note saved while hidden is
 * a note nobody can check before they tap, and neither form should send anything
 * that is off screen.
 */
export function OrderNote({
  open,
  onOpenChange,
  value,
  onChange,
  label = "اي ملاحظات",
  addLabel = "اضافة ملاحظة",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (note: string) => void;
  /** The field's own label once it is open. */
  label?: string;
  /** What the dashed button says while it is closed. */
  addLabel?: string;
  className?: string;
}) {
  if (!open) {
    return (
      <div className={className}>
        <DashedAddButton label={addLabel} onClick={() => onOpenChange(true)} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Mounted only when open, so `autoFocus` lands on the tap that opened it —
          no ref, no effect.

          `scroll-mb-44` keeps the field clear of whatever is pinned to the foot
          of the screen. The browser scrolls a focused field just barely into
          view, and "in view" counts the strip a fixed bar sits over — so the note
          landed underneath it. `scroll-margin-bottom` is the browser's own way of
          being told to leave room, and it applies to the scroll the browser does
          by itself; the `onFocus` nudge is for the second one, after the keyboard
          has finished opening and changed the viewport's height under it. */}
      <TextareaField
        id="order-notes"
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="مثلا: عاوز فرختين لوحدهم و ٣ لوحدهم..."
        autoFocus
        className="scroll-mb-44"
        onFocus={(event) => {
          const field = event.currentTarget;
          window.setTimeout(
            () => field.scrollIntoView({ block: "center" }),
            KEYBOARD_SETTLE_MS,
          );
        }}
      />
      <button
        type="button"
        onClick={() => {
          onOpenChange(false);
          onChange("");
        }}
        className="flex min-h-11 items-center gap-1 self-end px-1 text-sm text-muted"
      >
        <Icon name="close" size={16} aria-hidden />
        شيل الملاحظة
      </button>
    </div>
  );
}
