"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { toArabicDigits } from "@/lib/format";
import { FIELD_ACTIVE_SHADOW, FIELD_ERROR_SHADOW } from "./fieldShadows";

/**
 * Segmented PIN entry — the six boxes from the admin login. One real (invisible)
 * input holds the value and drives the on-screen keyboard; the boxes just render
 * the digits (Arabic-Indic, FR-3 — a PIN isn't a phone number). Tapping anywhere
 * on the row focuses the input. Digits fill left-to-right regardless of the
 * page's RTL direction (like a phone number), so the row is forced `dir="ltr"`.
 * Boxes flex so six of them fit down to 320px.
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
  const [isFocused, setIsFocused] = useState(false);
  const digits = value.split("");

  return (
    <div className="relative w-full">
      <div className="flex gap-2" dir="ltr" aria-hidden>
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex h-14 flex-1 items-center justify-center rounded-[10px] border-2 bg-surface-page transition-shadow",
              "text-h3 font-bold text-heading",
              error && FIELD_ERROR_SHADOW,
              !error && isFocused && FIELD_ACTIVE_SHADOW,
              !error && !isFocused && "border-border",
            )}
          >
            {digits[i] ? toArabicDigits(digits[i]) : ""}
          </div>
        ))}
      </div>

      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        disabled={disabled}
        maxLength={length}
        value={value}
        aria-label="الرقم السري"
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 h-full w-full cursor-pointer bg-transparent text-center text-transparent caret-transparent outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
