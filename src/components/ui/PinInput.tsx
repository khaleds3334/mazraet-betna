"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toArabicDigits, toLatinDigits } from "@/lib/format";
import { FIELD_ACTIVE_SHADOW, FIELD_ERROR_SHADOW } from "./fieldShadows";

/**
 * Segmented PIN entry — the six boxes from the admin login. Every box is its own
 * input: the first one takes focus on arrival, typing a digit moves to the next,
 * and the admin can tap any box to fix a single digit without retyping the rest.
 * Digits render Arabic-Indic (FR-3 — a PIN isn't a phone number) while the value
 * handed back stays Latin. Boxes fill left-to-right regardless of the page's RTL
 * direction (like a phone number), so the row is forced `dir="ltr"`, and they
 * flex so six of them fit down to 320px.
 */
type PinInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  describedBy?: string;
};

function toSlots(value: string, length: number): string[] {
  return Array.from({ length }, (_, i) => value[i] ?? "");
}

export function PinInput({
  id,
  value,
  onChange,
  length = 6,
  error = false,
  disabled = false,
  autoFocus = false,
  describedBy,
}: PinInputProps) {
  const [slots, setSlots] = useState<string[]>(() => toSlots(value, length));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  // The parent keeps the PIN as a plain string, so a hole — a box the admin
  // cleared in the middle — has no place to live there. Re-seed the boxes only
  // when the parent hands us a value that differs from what they already spell
  // (e.g. the form reset it), never on our own round-trip.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (slots.join("") !== value) setSlots(toSlots(value, length));
  }

  // `autoFocus` as an attribute lands before hydration, so the browser focuses
  // the box without React ever seeing the event and the green ring never shows.
  // Focus it ourselves once we're mounted — `onFocus` then marks it active.
  useEffect(() => {
    if (autoFocus && !disabled) inputs.current[0]?.focus();
    // Mount only — later focus moves are driven by typing and taps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verifying disables every box, which makes the browser drop focus. Take it
  // back the moment they're live again so a wrong PIN can be deleted straight
  // away — backspace after backspace, right to left — without the admin having
  // to tap a box first. Lands on the first empty box, or the last one if full.
  const wasDisabled = useRef(disabled);
  useEffect(() => {
    const reEnabled = wasDisabled.current && !disabled;
    wasDisabled.current = disabled;
    if (!reEnabled) return;

    const boxes = inputs.current;
    const firstEmpty = boxes.findIndex((box) => box && !box.value);
    boxes[firstEmpty === -1 ? boxes.length - 1 : firstEmpty]?.focus();
  }, [disabled]);

  function commit(next: string[]) {
    setSlots(next);
    onChange(next.join(""));
  }

  function focusBox(index: number) {
    const box = inputs.current[index];
    if (!box) return;
    box.focus();
    box.select();
  }

  // Writes `digits` starting at `index` and leaves focus on the last box it
  // touched — shared by typing and pasting.
  function fillFrom(index: number, digits: string) {
    const next = [...slots];
    for (let i = 0; i < digits.length && index + i < length; i++) {
      next[index + i] = digits[i];
    }
    commit(next);
    focusBox(Math.min(index + digits.length, length - 1));
  }

  function clearAt(index: number) {
    const next = [...slots];
    next[index] = "";
    commit(next);
  }

  function handleChange(index: number, raw: string) {
    let typed = toLatinDigits(raw).replace(/\D/g, "");

    // A soft keyboard can delete by emptying the box instead of sending a key.
    if (!typed) {
      clearAt(index);
      return;
    }

    // The box already held a digit and the new one landed next to it (the
    // select-on-focus didn't take) — the old digit is the one being replaced.
    if (typed.length > 1 && slots[index] && typed[0] === slots[index]) {
      typed = typed.slice(1);
    }

    fillFrom(index, typed);
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace") {
      event.preventDefault();
      // A filled box empties in place; an empty one steps back and empties that.
      if (slots[index]) {
        clearAt(index);
        return;
      }
      if (index > 0) {
        const next = [...slots];
        next[index - 1] = "";
        commit(next);
        focusBox(index - 1);
      }
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      clearAt(index);
      return;
    }

    // The row is LTR, so left is the previous box and right is the next one.
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) {
    event.preventDefault();
    const pasted = toLatinDigits(event.clipboardData.getData("text")).replace(
      /\D/g,
      "",
    );
    if (pasted) fillFrom(index, pasted);
  }

  return (
    <div className="flex w-full gap-2" dir="ltr">
      {slots.map((digit, index) => {
        const isActive = focusedIndex === index;

        return (
          <input
            key={index}
            id={index === 0 ? id : `${id}-${index + 1}`}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            value={digit ? toArabicDigits(digit) : ""}
            aria-label={`الرقم السري — الخانة ${toArabicDigits(index + 1)}`}
            aria-invalid={error || undefined}
            aria-describedby={describedBy}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => {
              setFocusedIndex(index);
              event.target.select();
            }}
            onBlur={() => setFocusedIndex((current) => (current === index ? null : current))}
            className={cn(
              "h-14 min-w-0 flex-1 rounded-[10px] border-2 bg-surface-page text-center transition-shadow",
              "text-h3 font-bold text-heading caret-transparent outline-none",
              "disabled:cursor-not-allowed",
              error && FIELD_ERROR_SHADOW,
              !error && isActive && FIELD_ACTIVE_SHADOW,
              !error && !isActive && "border-border",
            )}
          />
        );
      })}
    </div>
  );
}
